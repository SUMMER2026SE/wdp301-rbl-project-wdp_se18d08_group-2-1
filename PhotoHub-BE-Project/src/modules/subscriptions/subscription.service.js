const mongoose = require("mongoose");
const dayjs = require("dayjs");
const Subscription = require("./models/subscription.model");
const SubscriptionPackage = require("./models/subscriptionPackage.model");
const PaymentMethod = require("./models/paymentMethod.model");
const SubscriptionPayment = require("./models/subscriptionPayment.model");
const SubscriptionSchedule = require("./models/subscriptionSchedule.model");
const SubscriptionBooking = require("./models/subscriptionBooking.model");
const { Booking } = require("../bookings/models/booking.model");
const PhotographerPackage = require("../packages/models/photographerPackage.model");
const Photographer = require("../photographers/models/photographer");
const Wallet = require("../admin/models/Wallet");
const { UserRole, User } = require("../auth/models/User");
const Notification = require("../admin/models/Notification");
const { getIO } = require("../../socket");
const paymentService = require("./subscription.payment.service");
const scheduleService = require("./subscription.schedule.service");
const {
  SubscriptionStatus,
  BillingType,
  BookingStatus,
  SubscriptionPaymentStatus,
  SubscriptionPaymentKind,
} = require("./subscription.constants");
const {
  addMonths,
  buildCycleWindow,
  buildPauseEnd,
  calculateRemainingSessions,
  defaultPackages,
  sanitizePreferredSchedule,
  getBookedRangesForPhotographer,
  rangesOverlap,
  getCandidateDates,
  makeSuggestedSlots,
} = require("./subscription.helper");
const { getPhotographerIdentity } = require("../photographers/utils/photographerIdentity");

const DEFAULT_COMMITMENT = 1;
const DEFAULT_SESSIONS = 1;

const safeEmit = (userId, event, payload) => {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (_error) {
    // Socket is optional for background flows.
  }
};

const normalizeRole = (role) => String(role || "").toLowerCase();

const normalizeUserId = (value) => String(value?._id || value?.id || value || "");

const ensureWallet = async (userId, session = null) =>
  await Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, balance: 0, holdBalance: 0, currency: "VND" } },
    { new: true, upsert: true, ...(session ? { session } : {}) }
  );

const withOptionalTransaction = async (handler) => {
  const session = await mongoose.startSession();
  try {
    if (typeof session.withTransaction === "function") {
      let result;
      await session.withTransaction(async () => {
        result = await handler(session);
      });
      return result;
    }
    session.startTransaction();
    const result = await handler(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (_e) {
      // ignore
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const ensurePackageSeed = async () => {
  const count = await SubscriptionPackage.countDocuments();
  if (count > 0) return;
  await SubscriptionPackage.insertMany(defaultPackages());
};

const populateSubscription = async (subscription) => {
  if (!subscription) return null;
  return await subscription.populate([
    { path: "customer", select: "fullName email avatar role phoneNumber" },
    { path: "photographer", populate: { path: "user", select: "fullName email avatar role phoneNumber" } },
    { path: "package" },
    { path: "paymentMethod" },
  ]);
};

const isOwnerOrAdmin = async (subscription, user) => {
  if (!subscription || !user) return false;
  const role = normalizeRole(user.role);
  if (role === "admin" || role === "manager") return true;
  const userId = normalizeUserId(user);
  if (String(subscription.customer?._id || subscription.customer) === userId) return true;
  const identity = await getPhotographerIdentity(userId);
  return identity.ids.includes(String(subscription.photographer?._id || subscription.photographer));
};

const resolvePhotographer = async (photographerId) => {
  const photographer = await Photographer.findOne({
    $or: [
      { user: photographerId },
      { _id: photographerId },
    ],
  }).populate("user", "fullName email avatar role phoneNumber");
  return photographer;
};

const resolvePaymentMethod = async (customerId, paymentMethodId) => {
  if (!paymentMethodId) return null;
  return await PaymentMethod.findOne({
    _id: paymentMethodId,
    user: customerId,
    isActive: true,
  });
};

const createSystemNotification = async ({ recipientId, title, message, type = "SYSTEM", meta = {} }) => {
  try {
    await Notification.create({
      recipientType: "SPECIFIC",
      recipient: recipientId,
      title,
      message,
      type,
      isRead: false,
      meta,
    });
  } catch (_error) {
    // Notification is best-effort.
  }
};

const creditSubscriptionRevenue = async ({ subscription, paymentRecord, session = null }) => {
  if (!subscription || !paymentRecord) return { credited: false };

  const alreadyCredited = Boolean(paymentRecord.metadata?.walletCreditedAt);
  if (alreadyCredited) {
    return { credited: false, reason: "already_credited" };
  }

  const photographerDoc = await Photographer.findById(subscription.photographer).select("user displayName");
  const photographerUserId = normalizeUserId(photographerDoc?.user);
  if (!photographerUserId) {
    return { credited: false, reason: "photographer_user_missing" };
  }

  const amount = Number(paymentRecord.amount || 0);
  if (!amount || amount <= 0) {
    return { credited: false, reason: "invalid_amount" };
  }

  const wallet = await ensureWallet(photographerUserId, session);
  wallet.balance = Number(wallet.balance || 0) + amount;
  await wallet.save(session ? { session } : {});

  await Photographer.findByIdAndUpdate(
    subscription.photographer,
    { $inc: { totalEarnings: amount } },
    session ? { session } : {}
  );

  paymentRecord.metadata = {
    ...(paymentRecord.metadata || {}),
    walletCreditedAt: new Date().toISOString(),
    walletCreditedAmount: amount,
  };
  await paymentRecord.save(session ? { session } : {});

  safeEmit(photographerUserId, "wallet-updated", {
    balance: wallet.balance,
    amount,
    subscriptionId: subscription._id,
    paymentKind: paymentRecord.paymentKind,
    orderCode: paymentRecord.orderCode,
  });

  await createSystemNotification({
    recipientId: photographerUserId,
    title: "Subscription payment received",
    message: `A customer payment of ${amount.toLocaleString("vi-VN")} VND has been credited to your wallet.`,
    meta: {
      subscriptionId: subscription._id,
      paymentId: paymentRecord._id,
      amount,
      orderCode: paymentRecord.orderCode,
    },
  });

  return { credited: true, wallet, photographerUserId };
};

class SubscriptionService {
  async listPackages() {
    await ensurePackageSeed();
    return await SubscriptionPackage.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  }

  async getMySubscriptions(user) {
    const role = normalizeRole(user.role);
    const query = {};

    if (role === "customer") {
      query.customer = normalizeUserId(user);
    } else if (role === "photographer") {
      const identity = await getPhotographerIdentity(normalizeUserId(user));
      query.photographer = { $in: identity.ids.filter(Boolean) };
    }

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .populate("customer", "fullName email avatar role")
      .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar role" } })
      .populate("package")
      .populate("paymentMethod");

    return subscriptions;
  }

  async getSubscriptionById(id, user) {
    const subscription = await Subscription.findById(id)
      .populate("customer", "fullName email avatar role phoneNumber")
      .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar role phoneNumber" } })
      .populate("package")
      .populate("paymentMethod");

    if (!subscription) {
      throw new Error("Subscription not found");
    }
    if (!(await isOwnerOrAdmin(subscription, user))) {
      throw new Error("You are not authorized to view this subscription");
    }

    const schedules = await SubscriptionSchedule.find({ subscription: subscription._id }).sort({ cycleIndex: 1 });
    const payments = await SubscriptionPayment.find({ subscription: subscription._id }).sort({ createdAt: -1 });
    const remaining = await this.getRemainingSessionsBySubscription(subscription);

    return {
      ...subscription.toObject(),
      bookingSchedule: schedules,
      billingHistory: payments,
      remainingSessions: remaining,
    };
  }

  async purchaseSubscription(user, dto) {
    const customerId = normalizeUserId(user);
    await ensurePackageSeed();

    return await withOptionalTransaction(async (session) => {
      const subscriptionPackage = await SubscriptionPackage.findById(dto.packageId).session(session);
      if (!subscriptionPackage || !subscriptionPackage.isActive) {
        throw new Error("Subscription package not found");
      }

      const sourcePackageId = subscriptionPackage?.metadata?.sourcePackageId;
      if (sourcePackageId) {
        const sourcePackage = await PhotographerPackage.findById(sourcePackageId).session(session);
        if (!sourcePackage || String(sourcePackage.status || "").toUpperCase() !== "ACTIVE") {
          throw new Error("This monthly plan is no longer available");
        }
      }

      const photographer = await resolvePhotographer(dto.photographerId);
      if (!photographer) {
        throw new Error("Photographer not found");
      }
      if (photographer.verificationStatus !== "VERIFIED") {
        throw new Error("Photographer is not verified yet");
      }
      if (!photographer.isAvailable) {
        throw new Error("Photographer is currently unavailable");
      }

      const startDate = new Date(dto.startDate);
      const commitmentMonths = Number(dto.commitmentMonths || subscriptionPackage.commitmentMonths || DEFAULT_COMMITMENT);
      const sessionsPerMonth = Number(dto.sessionsPerMonth || subscriptionPackage.sessionsPerMonth || DEFAULT_SESSIONS);
      const autoRenew = typeof dto.autoRenew === "boolean" ? dto.autoRenew : Boolean(subscriptionPackage.autoRenewDefault);
      const preferredSchedule = sanitizePreferredSchedule(dto.preferredSchedule, []);

      const paymentMethod = await resolvePaymentMethod(customerId, dto.paymentMethodId);
      const endDate = addMonths(startDate, commitmentMonths);
      const currentCycle = buildCycleWindow(startDate, 0);

      const subscription = await Subscription.create([{
        customer: customerId,
        photographer: photographer._id,
        package: subscriptionPackage._id,
        paymentMethod: paymentMethod?._id || null,
        status: SubscriptionStatus.PENDING_PAYMENT,
        billingType: subscriptionPackage.billingType || BillingType.MONTHLY,
        autoRenew,
        startDate,
        endDate,
        commitmentMonths,
        sessionsPerMonth,
        currentCycleStart: currentCycle.cycleStart,
        currentCycleEnd: currentCycle.cycleEnd,
        nextResetDate: currentCycle.cycleEnd,
        preferredSchedule,
        bookingLocationPreference: dto.bookingLocationPreference || dto.locationPreference || "",
        notes: dto.notes || "",
        commitmentSnapshot: {
          packageName: subscriptionPackage.name,
          monthlyPrice: subscriptionPackage.monthlyPrice,
          perSessionPrice: subscriptionPackage.perSessionPrice,
          sessionsPerMonth,
          commitmentMonths,
          startDate,
        },
      }], { session }).then((items) => items[0]);

      const monthlyAmount = subscriptionPackage.billingType === BillingType.PER_SESSION
        ? Number(subscriptionPackage.perSessionPrice || 0) * sessionsPerMonth
        : Number(subscriptionPackage.monthlyPrice || 0) * commitmentMonths;

      const paymentRecord = await paymentService.createPaymentRecord({
        subscription,
        customer: customerId,
        photographer: photographer._id,
        paymentMethod,
        amount: monthlyAmount,
        billingType: subscriptionPackage.billingType || BillingType.MONTHLY,
        paymentKind: SubscriptionPaymentKind.PURCHASE,
        provider: paymentMethod?.provider || "PAYOS",
        metadata: {
          packageId: subscriptionPackage._id,
          packageName: subscriptionPackage.name,
          startDate,
          commitmentMonths,
          sessionsPerMonth,
          autoRenew,
        },
      });

      const paymentLink = await paymentService.createPayOSLink(paymentRecord);

      subscription.lastPaymentStatus = SubscriptionPaymentStatus.PENDING;
      subscription.lastPaymentOrderCode = paymentRecord.orderCode;
      await subscription.save({ session });

      const shouldAutoActivate = process.env.SUBSCRIPTION_ALLOW_MOCK_PAYMENT === "true" || paymentLink.provider === "MOCK";
      if (shouldAutoActivate) {
        await this.activateSubscription(subscription._id, customerId, {
          paymentRecordId: paymentRecord._id,
          autoGenerateSessions: true,
          session,
        });
      } else {
        await createSystemNotification({
          recipientId: customerId,
          title: "Subscription payment pending",
          message: `Complete the payment for ${subscriptionPackage.name} to activate your subscription.`,
          meta: { subscriptionId: subscription._id, orderCode: paymentRecord.orderCode },
        });
      }

      const populated = await populateSubscription(await Subscription.findById(subscription._id).session(session));

      return {
        subscription: populated,
        payment: paymentRecord,
        paymentLink,
      };
    });
  }

  async activateSubscription(subscriptionId, actorId, { paymentRecordId = null, autoGenerateSessions = true, session = null } = {}) {
    const query = Subscription.findById(subscriptionId);
    if (session) query.session(session);
    const subscription = await query;
    if (!subscription) throw new Error("Subscription not found");

    const updated = subscription;
    updated.status = SubscriptionStatus.ACTIVE;
    updated.lastPaymentStatus = SubscriptionPaymentStatus.SUCCESS;
    updated.lastPaymentAt = new Date();
    if (paymentRecordId) {
      const paymentRecord = await SubscriptionPayment.findById(paymentRecordId);
      if (paymentRecord) {
        if (paymentRecord.status !== SubscriptionPaymentStatus.SUCCESS) {
          paymentRecord.status = SubscriptionPaymentStatus.SUCCESS;
          paymentRecord.paidAt = paymentRecord.paidAt || new Date();
          await paymentRecord.save(session ? { session } : {});
        }
        if (!paymentRecord.metadata?.walletCreditedAt) {
          const creditResult = await creditSubscriptionRevenue({ subscription: updated, paymentRecord, session });
          if (creditResult?.credited) {
            updated.amountPaid += Number(paymentRecord.amount || 0);
          }
        }
        updated.lastPaymentOrderCode = paymentRecord.orderCode;
      }
    }

    await updated.save(session ? { session } : {});

    if (autoGenerateSessions) {
      await scheduleService.generateSessions(updated, { cycleIndex: 0, force: true, session });
    }

      await createSystemNotification({
        recipientId: updated.customer,
        title: "Subscription activated",
        message: `Your subscription ${updated._id} is now active.`,
        meta: { subscriptionId: updated._id },
      });

    try {
      const photographerDoc = await Photographer.findById(updated.photographer).populate("user", "fullName email avatar role");
      const photographerUserId = normalizeUserId(photographerDoc?.user);
      if (photographerUserId) {
        safeEmit(photographerUserId, "subscription-updated", {
          subscriptionId: updated._id,
          status: updated.status,
        });
      }
    } catch (_error) {
      // best effort only
    }

    return updated;
  }

  async getRemainingSessionsBySubscription(subscriptionOrId) {
    const subscription = typeof subscriptionOrId === "object" && subscriptionOrId._id
      ? subscriptionOrId
      : await Subscription.findById(subscriptionOrId);
    if (!subscription) throw new Error("Subscription not found");
    return await calculateRemainingSessions({
      subscription,
      cycleStart: subscription.currentCycleStart,
      cycleEnd: subscription.currentCycleEnd,
    });
  }

  async getRemainingSessions(id, user) {
    const subscription = await Subscription.findById(id)
      .populate("customer", "fullName email avatar role")
      .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar role" } })
      .populate("package")
      .populate("paymentMethod");
    if (!subscription) throw new Error("Subscription not found");
    if (!(await isOwnerOrAdmin(subscription, user))) {
      throw new Error("You are not authorized to view this subscription");
    }
    return await this.getRemainingSessionsBySubscription(subscription);
  }

  async pauseSubscription(id, user, { pauseDays = 30 } = {}) {
    return await withOptionalTransaction(async (session) => {
      const subscription = await Subscription.findById(id).session(session);
      if (!subscription) throw new Error("Subscription not found");
      if (!(await isOwnerOrAdmin(subscription, user))) throw new Error("You are not authorized to pause this subscription");

      if (subscription.status === SubscriptionStatus.CANCELLED || subscription.status === SubscriptionStatus.EXPIRED) {
        throw new Error("Cannot pause a cancelled or expired subscription");
      }
      if (subscription.status === SubscriptionStatus.PAUSED) {
        throw new Error("Subscription is already paused");
      }

      const effectivePauseDays = Math.min(Number(pauseDays || 30), Number(subscription.package?.maxPauseDays || 30));
      const pausedAt = new Date();
      const pauseUntil = buildPauseEnd(pausedAt, effectivePauseDays);

      subscription.status = SubscriptionStatus.PAUSED;
      subscription.pausedAt = pausedAt;
      subscription.pauseUntil = pauseUntil;
      subscription.pausedDaysTotal += effectivePauseDays;
      subscription.endDate = addMonths(subscription.endDate, 0); // preserve current end date baseline
      subscription.endDate = dayjs(subscription.endDate).add(effectivePauseDays, "day").toDate();
      subscription.currentCycleEnd = dayjs(subscription.currentCycleEnd).add(effectivePauseDays, "day").toDate();
      subscription.nextResetDate = subscription.currentCycleEnd;
      await subscription.save({ session });

      await scheduleService.markFutureBookings(subscription._id, {
        status: BookingStatus.NEED_RESCHEDULE,
        reason: "Subscription is paused; booking needs reschedule",
        session,
      });

      await createSystemNotification({
        recipientId: subscription.customer,
        title: "Subscription paused",
        message: `Your subscription has been paused for ${effectivePauseDays} day(s).`,
        meta: { subscriptionId: subscription._id, pauseDays: effectivePauseDays },
      });

      return await populateSubscription(subscription);
    });
  }

  async resumeSubscription(id, user) {
    return await withOptionalTransaction(async (session) => {
      const subscription = await Subscription.findById(id).session(session);
      if (!subscription) throw new Error("Subscription not found");
      if (!(await isOwnerOrAdmin(subscription, user))) throw new Error("You are not authorized to resume this subscription");

      if (subscription.status !== SubscriptionStatus.PAUSED) {
        throw new Error("Subscription is not paused");
      }

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.pausedAt = null;
      subscription.pauseUntil = null;
      subscription.currentCycleStart = dayjs().startOf("day").toDate();
      subscription.currentCycleEnd = dayjs(subscription.currentCycleStart).add(1, "month").subtract(1, "millisecond").toDate();
      subscription.nextResetDate = subscription.currentCycleEnd;
      await subscription.save({ session });

      await scheduleService.generateSessions(subscription, { cycleIndex: 0, force: true, session });

      await createSystemNotification({
        recipientId: subscription.customer,
        title: "Subscription resumed",
        message: "Your subscription is active again.",
        meta: { subscriptionId: subscription._id },
      });

      return await populateSubscription(subscription);
    });
  }

  async renewSubscription(id, user, { forceCharge = false } = {}) {
    return await withOptionalTransaction(async (session) => {
      const subscription = await Subscription.findById(id)
        .populate("package")
        .populate("paymentMethod")
        .session(session);
      if (!subscription) throw new Error("Subscription not found");
      if (!(await isOwnerOrAdmin(subscription, user))) throw new Error("You are not authorized to renew this subscription");
      if (subscription.status === SubscriptionStatus.CANCELLED) throw new Error("Cancelled subscription cannot be renewed");
      if (subscription.status === SubscriptionStatus.EXPIRED) throw new Error("Expired subscription must be repurchased");

      const months = Number(subscription.commitmentMonths || subscription.package?.commitmentMonths || 1);
      const amount = Number(subscription.package?.monthlyPrice || 0) * months;

      subscription.status = SubscriptionStatus.RENEWING;
      await subscription.save({ session });

      const paymentRecord = await paymentService.createPaymentRecord({
        subscription,
        customer: subscription.customer,
        photographer: subscription.photographer,
        paymentMethod: subscription.paymentMethod,
        amount,
        billingType: subscription.billingType,
        paymentKind: SubscriptionPaymentKind.RENEWAL,
        provider: subscription.paymentMethod?.provider || "PAYOS",
        metadata: {
          reason: forceCharge ? "manual_force_charge" : "renewal",
          months,
        },
      });

      const paymentLink = await paymentService.createPayOSLink(paymentRecord);
      if (paymentLink.provider === "MOCK" || process.env.SUBSCRIPTION_ALLOW_MOCK_PAYMENT === "true" || forceCharge) {
        paymentRecord.status = SubscriptionPaymentStatus.SUCCESS;
        paymentRecord.paidAt = new Date();
        await paymentRecord.save({ session });

        await creditSubscriptionRevenue({ subscription, paymentRecord, session });
        subscription.amountPaid += amount;
        subscription.renewalCount += 1;
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.endDate = addMonths(subscription.endDate, months);
        subscription.currentCycleStart = subscription.nextResetDate || subscription.currentCycleStart;
        subscription.currentCycleEnd = addMonths(subscription.currentCycleStart, 1);
        subscription.currentCycleEnd = dayjs(subscription.currentCycleEnd).subtract(1, "millisecond").toDate();
        subscription.nextResetDate = subscription.currentCycleEnd;
        subscription.lastPaymentStatus = SubscriptionPaymentStatus.SUCCESS;
        subscription.lastPaymentAt = new Date();
        subscription.lastPaymentOrderCode = paymentRecord.orderCode;
        await subscription.save({ session });

        await scheduleService.generateSessions(subscription, { cycleIndex: subscription.renewalCount, force: true, session });
      } else {
        subscription.lastPaymentStatus = SubscriptionPaymentStatus.PENDING;
        subscription.lastPaymentOrderCode = paymentRecord.orderCode;
        await subscription.save({ session });
      }

      await createSystemNotification({
        recipientId: subscription.customer,
        title: "Subscription renewal",
        message: paymentLink.provider === "MOCK"
          ? "Your subscription has been renewed."
          : "Renewal payment is ready.",
        meta: { subscriptionId: subscription._id, paymentId: paymentRecord._id },
      });

      return {
        subscription: await populateSubscription(subscription),
        payment: paymentRecord,
        paymentLink,
      };
    });
  }

  async cancelSubscription(id, user, { reason = "" } = {}) {
    return await withOptionalTransaction(async (session) => {
      const subscription = await Subscription.findById(id)
        .populate("package")
        .populate("paymentMethod")
        .session(session);
      if (!subscription) throw new Error("Subscription not found");
      if (!(await isOwnerOrAdmin(subscription, user))) throw new Error("You are not authorized to cancel this subscription");
      if (subscription.status === SubscriptionStatus.CANCELLED) throw new Error("Subscription is already cancelled");

      const completedSessions = await SubscriptionBooking.countDocuments({
        subscription: subscription._id,
        status: "COMPLETED",
      }).session(session);
      const retailPriceOfCompletedSessions = completedSessions * Number(subscription.package?.monthlyPrice || 0);
      const amountPaid = Number(subscription.amountPaid || 0);
      const penalty = Math.max(0, retailPriceOfCompletedSessions - amountPaid);

      let penaltyPayment = null;
      if (penalty > 0) {
        penaltyPayment = await paymentService.createPaymentRecord({
          subscription,
          customer: subscription.customer,
          photographer: subscription.photographer,
          paymentMethod: subscription.paymentMethod,
          amount: penalty,
          billingType: subscription.billingType,
          paymentKind: SubscriptionPaymentKind.PENALTY,
          provider: subscription.paymentMethod?.provider || "PAYOS",
          metadata: {
            reason: reason || "early_cancel_penalty",
            completedSessions,
            retailPriceOfCompletedSessions,
            amountPaid,
          },
        });

        const link = await paymentService.createPayOSLink(penaltyPayment);
        if (link.provider !== "MOCK" && process.env.SUBSCRIPTION_ALLOW_MOCK_PAYMENT !== "true") {
          subscription.status = SubscriptionStatus.PENDING_CANCEL;
          subscription.cancelPenaltyAmount = penalty;
          subscription.lastPaymentStatus = SubscriptionPaymentStatus.PENDING;
          await subscription.save({ session });
          return {
            subscription: await populateSubscription(subscription),
            penaltyPayment,
            paymentLink: link,
            penalty,
            pendingCancel: true,
          };
        }

        penaltyPayment.status = SubscriptionPaymentStatus.SUCCESS;
        penaltyPayment.paidAt = new Date();
        await penaltyPayment.save({ session });
        subscription.penaltyPaid += penalty;
      }

      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelPenaltyAmount = penalty;
      subscription.lastPaymentStatus = penalty > 0 ? SubscriptionPaymentStatus.SUCCESS : subscription.lastPaymentStatus;
      subscription.lastPaymentAt = new Date();
      await subscription.save({ session });

      await scheduleService.markFutureBookings(subscription._id, {
        status: BookingStatus.CANCELLED,
        reason: reason || "Subscription cancelled",
        session,
      });

      await createSystemNotification({
        recipientId: subscription.customer,
        title: "Subscription cancelled",
        message: penalty > 0 ? `Subscription cancelled after penalty payment of ${penalty.toLocaleString("vi-VN")} VND.` : "Subscription cancelled successfully.",
        meta: { subscriptionId: subscription._id, penalty },
      });

      return {
        subscription: await populateSubscription(subscription),
        penalty,
        penaltyPayment,
      };
    });
  }

  async generateSessions(id, user, options = {}) {
    const subscription = await Subscription.findById(id)
      .populate("package")
      .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar role" } })
      .populate("paymentMethod");
    if (!subscription) throw new Error("Subscription not found");
    if (!(await isOwnerOrAdmin(subscription, user))) throw new Error("You are not authorized to generate sessions for this subscription");
    if ([SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED, SubscriptionStatus.PAUSED].includes(subscription.status)) {
      throw new Error("Cannot generate sessions for inactive subscription");
    }

    const schedule = await scheduleService.generateSessions(subscription, options);
    return schedule;
  }

  async handlePaymentWebhook(payload) {
    const orderCode = payload?.data?.orderCode || payload?.orderCode || payload?.code;
    if (!orderCode) {
      throw new Error("orderCode is required");
    }

    const payment = await paymentService.findByOrderCode(orderCode);
    if (!payment) {
      throw new Error("Payment record not found");
    }

    const isSuccess = paymentService.isSuccessPayload(payload);
    const isCanceled = paymentService.isCanceledPayload(payload);

    if (isSuccess) {
      await paymentService.markSuccess(payment, payload);
      const subscription = await Subscription.findById(payment.subscription);
      if (!subscription) throw new Error("Subscription not found");
      if (payment.paymentKind === SubscriptionPaymentKind.PURCHASE || payment.paymentKind === SubscriptionPaymentKind.RENEWAL) {
        const creditResult = await creditSubscriptionRevenue({ subscription, paymentRecord: payment });
        if (creditResult?.credited) {
          subscription.amountPaid += Number(payment.amount || 0);
        }
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.lastPaymentStatus = SubscriptionPaymentStatus.SUCCESS;
        subscription.lastPaymentAt = new Date();
        subscription.lastPaymentOrderCode = payment.orderCode;
        await subscription.save();

        if (payment.paymentKind === SubscriptionPaymentKind.PURCHASE) {
          await this.activateSubscription(subscription._id, subscription.customer, {
            paymentRecordId: payment._id,
            autoGenerateSessions: true,
          });
        } else {
          await scheduleService.generateSessions(subscription, { cycleIndex: subscription.renewalCount, force: true });
        }
      } else if (payment.paymentKind === SubscriptionPaymentKind.PENALTY) {
        await this.cancelSubscription(subscription._id, { id: subscription.customer, role: UserRole.CUSTOMER }, {
          reason: "Penalty payment confirmed",
        });
      }
      return { payment, subscriptionId: payment.subscription, status: "SUCCESS" };
    }

    if (isCanceled) {
      await paymentService.markFailed(payment, "Payment cancelled", payload);
      const subscription = await Subscription.findById(payment.subscription);
      if (subscription) {
        subscription.lastPaymentStatus = SubscriptionPaymentStatus.FAILED;
        await subscription.save();
      }
      return { payment, subscriptionId: payment.subscription, status: "CANCELLED" };
    }

    if (paymentService.isPendingPayload(payload)) {
      return { payment, subscriptionId: payment.subscription, status: "PENDING" };
    }

    await paymentService.markFailed(payment, payload?.description || "Webhook indicated failed payment", payload);
    const subscription = await Subscription.findById(payment.subscription);
    if (subscription) {
      subscription.lastPaymentStatus = SubscriptionPaymentStatus.FAILED;
      await subscription.save();
    }
    return { payment, subscriptionId: payment.subscription, status: "FAILED" };
  }

  async getPaymentStatusByOrderCode(orderCode, user) {
    const payment = await paymentService.findByOrderCode(orderCode);
    if (!payment) throw new Error("Payment record not found");

    const subscription = await Subscription.findById(payment.subscription)
      .populate("customer", "fullName email avatar role")
      .populate({ path: "photographer", populate: { path: "user", select: "fullName email avatar role" } })
      .populate("package")
      .populate("paymentMethod");

    if (!subscription) throw new Error("Subscription not found");
    if (!(await isOwnerOrAdmin(subscription, user))) {
      throw new Error("You are not authorized to view this payment");
    }

    let payosStatus = "";
    try {
      const payosInfo = await paymentService.getPayOSPaymentStatus(payment.paymentLinkId || payment.orderCode);
      payosStatus = String(payosInfo?.status || payosInfo?.data?.status || "").toUpperCase();

      if (payosStatus === "PAID" || payosStatus === "SUCCESS" || payosStatus === "SUCCESSFUL" || payosStatus === "00") {
        if (payment.status !== SubscriptionPaymentStatus.SUCCESS) {
          await paymentService.markSuccess(payment, payosInfo);
        }

        if (![SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED].includes(subscription.status)) {
          const creditResult = await creditSubscriptionRevenue({ subscription, paymentRecord: payment });
          if (creditResult?.credited) {
            subscription.amountPaid += Number(payment.amount || 0);
          }
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.lastPaymentStatus = SubscriptionPaymentStatus.SUCCESS;
          subscription.lastPaymentAt = new Date();
          subscription.lastPaymentOrderCode = payment.orderCode;
          await subscription.save();

          if (payment.paymentKind === SubscriptionPaymentKind.PURCHASE) {
            await this.activateSubscription(subscription._id, subscription.customer, {
              paymentRecordId: payment._id,
              autoGenerateSessions: true,
            });
          } else if (payment.paymentKind === SubscriptionPaymentKind.RENEWAL) {
            await scheduleService.generateSessions(subscription, { cycleIndex: subscription.renewalCount, force: true });
          }
        }
      } else if (payosStatus === "CANCELLED" || payosStatus === "CANCELED" || payosStatus === "EXPIRED") {
        if (payment.status !== SubscriptionPaymentStatus.FAILED) {
          await paymentService.markFailed(payment, `PayOS payment ${payosStatus.toLowerCase()}`, payosInfo);
        }
        subscription.lastPaymentStatus = SubscriptionPaymentStatus.FAILED;
        await subscription.save();
      }
    } catch (syncError) {
      console.warn("[Subscription] paymentStatus sync skipped:", syncError.message);
    }

    return {
      payment,
      subscription,
      paymentStatus: payment.status,
      subscriptionStatus: subscription.status,
      paid: payment.status === SubscriptionPaymentStatus.SUCCESS,
      orderCode: payment.orderCode,
      payosStatus,
    };
  }

  async getSummaryForSubscription(id, user) {
    return await this.getRemainingSessions(id, user);
  }
}

module.exports = new SubscriptionService();
