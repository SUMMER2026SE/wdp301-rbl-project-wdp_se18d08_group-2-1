const Booking = require("./booking.model");
const Photographer = require("../models/photographer");
const Payment = require("../../admin/models/Payment");
const Wallet = require("../../admin/models/Wallet");
const Commission = require("../../admin/models/Commission");
const { PayOS } = require("@payos/node");
const { ACTIVE_BOOKING_STATUSES, rangesOverlap } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

const APPROVAL_WINDOW_HOURS = 72;
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);

const toLowerStatus = (status = "") => String(status).toLowerCase();
const getBookingAmount = (booking) => Number(booking.totalPrice || booking.price || booking.depositAmount || 0);
const isPaidStatus = (status) => ["paid", "deposit_paid"].includes(toLowerStatus(status));
const appendQuery = (url, params) => {
  const parsedUrl = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      parsedUrl.searchParams.set(key, value);
    }
  });
  return parsedUrl.toString();
};

let payosClient = null;

const getPayOS = () => {
  if (payosClient) return payosClient;
  payosClient = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });
  return payosClient;
};

const ensureWallet = async (userId) =>
  Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, balance: 0, holdBalance: 0, currency: "VND" } },
    { new: true, upsert: true }
  );

const resolvePhotographerUserId = async (photographerRef) => {
  const photographer = await Photographer.findOne({
    $or: [{ _id: photographerRef }, { user: photographerRef }],
  }).select("user");

  return photographer?.user || photographerRef;
};

const pushStatusLog = (booking, status, note) => {
  booking.statusLogs = booking.statusLogs || [];
  booking.statusLogs.push({ status, note, updatedAt: new Date() });
};

class BookingService {
  async findBookingById(id) {
    return await Booking.findById(id).populate("customer", "fullName email avatar");
  }

  async checkOverlap(photographerIds, start, end, excludeBookingId = null) {
    const ids = Array.isArray(photographerIds) ? photographerIds : [photographerIds];
    const query = {
      photographer: { $in: ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      $or: [
        { start: { $lt: end, $gte: start } },
        { end: { $gt: start, $lte: end } },
        { start: { $lte: start }, end: { $gte: end } },
        { bookingDate: { $lt: end, $gte: start } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const overlapCount = await Booking.countDocuments(query);
    return overlapCount > 0;
  }

  async getBusyBookings(photographerIds, from, to, excludeBookingId = null) {
    const ids = Array.isArray(photographerIds) ? photographerIds : [photographerIds];
    const query = {
      photographer: { $in: ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      $or: [
        { start: { $lt: to }, end: { $gt: from } },
        { bookingDate: { $lt: to, $gt: from } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query).select("start end bookingDate durationHours status title").sort({ start: 1 });
    return bookings.map((booking) => ({
      ...booking.toObject(),
      ...normalizeBookingTime(booking),
    }));
  }

  async suggestAlternativeSlots(photographerIds, preferredStart, preferredEnd, excludeBookingId = null) {
    const originalStart = new Date(preferredStart);
    const originalEnd = new Date(preferredEnd);
    const durationMs = Math.max(60 * 60 * 1000, originalEnd - originalStart);
    const searchStart = new Date(Math.max(Date.now(), originalStart.getTime()));
    const searchEnd = new Date(searchStart.getTime() + 21 * 24 * 60 * 60 * 1000);
    const busyBookings = await this.getBusyBookings(photographerIds, searchStart, searchEnd, excludeBookingId);

    const suggestions = [];
    const preferredHour = originalStart.getHours();

    for (let dayOffset = 0; dayOffset < 21 && suggestions.length < 6; dayOffset += 1) {
      const day = new Date(searchStart);
      day.setDate(searchStart.getDate() + dayOffset);

      const candidateHours = [preferredHour, 8, 10, 13, 15, 17]
        .filter((hour, index, arr) => hour >= 8 && hour <= 18 && arr.indexOf(hour) === index);

      for (const hour of candidateHours) {
        const candidateStart = new Date(day);
        candidateStart.setHours(hour, 0, 0, 0);
        const candidateEnd = new Date(candidateStart.getTime() + durationMs);

        if (candidateStart < new Date()) continue;
        if (candidateEnd.getHours() > 21 || candidateEnd.getDate() !== candidateStart.getDate()) continue;

        const conflicts = busyBookings.some((booking) =>
          rangesOverlap(candidateStart, candidateEnd, booking.start, booking.end)
        );

        if (!conflicts) {
          const dayDistancePenalty = Math.min(dayOffset * 4, 60);
          const hourDistancePenalty = Math.min(Math.abs(hour - preferredHour) * 3, 25);
          suggestions.push({
            start: candidateStart,
            end: candidateEnd,
            score: Math.max(10, 100 - dayDistancePenalty - hourDistancePenalty),
            reason:
              dayOffset === 0
                ? "Same-day free slot with no calendar conflict"
                : "Nearest free slot based on photographer availability",
          });
        }

        if (suggestions.length >= 6) break;
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  async rejectBooking(bookingId, photographerUserId, rejectReason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to reject this booking");
    }

    if (["rejected", "cancelled", "disputed"].includes(toLowerStatus(booking.status))) {
      throw new Error("Booking is already rejected or cancelled");
    }

    const bookingTime = normalizeBookingTime(booking);
    const hasConflict = await this.checkOverlap(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    const alternativeSlots = await this.suggestAlternativeSlots(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    booking.status = "rejected";
    booking.rejectReason = rejectReason || (hasConflict ? "Scheduling conflict" : "Photographer rejected");
    booking.suggestedSlots = alternativeSlots;
    await booking.save();

    return {
      booking,
      hasConflict,
      alternativeSlots,
      message: hasConflict
        ? "Booking rejected because of a scheduling conflict. Alternative slots were generated."
        : "Booking rejected. Alternative slots were generated for the customer.",
    };
  }

  async acceptBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to accept this booking");
    }

    const status = toLowerStatus(booking.status);
    if (!["pending", "accepted"].includes(status)) {
      throw new Error("Only pending bookings can be accepted");
    }

    const bookingTime = normalizeBookingTime(booking);
    const hasConflict = await this.checkOverlap(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    if (hasConflict) {
      throw new Error("This booking conflicts with another active booking");
    }

    booking.status = "accepted";
    pushStatusLog(booking, "ACCEPTED", "Photographer accepted booking and opened customer consultation chat");
    await booking.save();

    const chatService = require("../chat/chat.service");
    const conversation = await chatService.findOrCreateConversation(
      [booking.customer.toString(), photographerUserId.toString()],
      booking._id
    );

    const existingMessages = await chatService.getMessages(conversation._id, photographerUserId);
    if (existingMessages.length === 0) {
      await chatService.createMessage(conversation._id, photographerUserId, {
        text: `Booking "${booking.title || "Photo session"}" has been accepted. You can discuss details here.`,
        messageType: "booking_detail",
        metadata: {
          bookingId: booking._id,
          status: booking.status,
          start: booking.start || booking.bookingDate,
          end: booking.end,
          location: booking.location,
          price: getBookingAmount(booking),
        },
      });
    }

    return { booking, conversation };
  }

  async createPaymentLink(bookingId, customerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (String(booking.customer) !== String(customerUserId)) {
      throw new Error("You are not authorized to pay for this booking");
    }

    if (isPaidStatus(booking.paymentStatus)) {
      return {
        booking,
        checkoutUrl: booking.paymentLink,
        paymentLinkId: booking.paymentLinkId,
        orderCode: booking.payosOrderCode,
        alreadyPaid: true,
      };
    }

    const status = toLowerStatus(booking.status);
    if (!["accepted", "confirmed", "deposit_paid", "in_progress"].includes(status)) {
      throw new Error("Photographer must accept this booking before customer payment");
    }

    const amount = Math.round(getBookingAmount(booking));
    if (!amount || amount <= 0) {
      throw new Error("Booking amount must be greater than 0");
    }

    const orderCode =
      booking.payosOrderCode ||
      Number(`${Date.now()}${String(booking._id).slice(-4).replace(/\D/g, "") || "0"}`.slice(-12));
    const resultUrl = process.env.FE_PAYMENT_RESULT_URL || `${DEFAULT_FRONTEND_URL}/payment-result`;
    const returnUrl = appendQuery(process.env.PAYOS_RETURN_URL || resultUrl, {
      bookingId: booking._id,
      orderCode,
    });
    const cancelUrl = appendQuery(process.env.PAYOS_CANCEL_URL || resultUrl, {
      bookingId: booking._id,
      orderCode,
      cancelled: "true",
      canceled: "true",
    });

    const paymentData = {
      orderCode,
      amount,
      description: `PhotoHub booking ${String(booking._id).slice(-6)}`,
      items: [
        {
          name: booking.title || "PhotoHub booking",
          quantity: 1,
          price: amount,
        },
      ],
      returnUrl,
      cancelUrl,
    };

    const paymentLink = await getPayOS().paymentRequests.create(paymentData);

    booking.payosOrderCode = orderCode;
    booking.paymentLinkId = paymentLink.paymentLinkId || paymentLink.id || booking.paymentLinkId;
    booking.paymentLink = paymentLink.checkoutUrl || paymentLink.paymentLink || paymentLink.href;
    booking.paymentStatus = "pending";
    pushStatusLog(booking, "PAYMENT_PENDING", "Customer created a PayOS payment link");
    await booking.save();

    const photographerUserId = await resolvePhotographerUserId(booking.photographer);
    await Payment.findOneAndUpdate(
      { booking: booking._id, transactionId: String(orderCode), paymentType: "DEPOSIT" },
      {
        $setOnInsert: {
          booking: booking._id,
          sender: booking.customer,
          receiver: photographerUserId,
          amount,
          paymentType: "DEPOSIT",
          paymentMethod: "PAYOS",
          transactionId: String(orderCode),
          status: "PENDING",
        },
      },
      { upsert: true, new: true }
    );

    return {
      booking,
      checkoutUrl: booking.paymentLink,
      paymentLinkId: booking.paymentLinkId,
      orderCode,
    };
  }

  async getPaidAmount(bookingId) {
    const payments = await Payment.find({
      booking: bookingId,
      status: "SUCCESS",
      paymentType: { $in: ["DEPOSIT", "FINAL"] },
    }).select("amount");

    return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  async releaseEscrowToAvailable(booking) {
    const paidAmount = Number(booking.paidAmount || (await this.getPaidAmount(booking._id)) || getBookingAmount(booking));
    if (!paidAmount || paidAmount <= 0) {
      return null;
    }

    const photographerUserId = await resolvePhotographerUserId(booking.photographer);
    const wallet = await ensureWallet(photographerUserId);
    const amountFromHold = Math.min(Number(wallet.holdBalance || 0), paidAmount);
    wallet.holdBalance = Math.max(0, Number(wallet.holdBalance || 0) - amountFromHold);
    wallet.balance = Number(wallet.balance || 0) + amountFromHold;
    await wallet.save();
    return wallet;
  }

  async markBookingPaid(booking, paymentPayload = {}) {
    const amount = Number(paymentPayload.amount || getBookingAmount(booking));
    if (!amount || amount <= 0) {
      throw new Error("Invalid paid amount");
    }

    const existingSuccessfulPayment = await Payment.findOne({
      booking: booking._id,
      transactionId: paymentPayload.transactionId ? String(paymentPayload.transactionId) : String(booking.payosOrderCode),
      status: "SUCCESS",
      paymentType: { $in: ["DEPOSIT", "FINAL"] },
    });

    const photographerUserId = await resolvePhotographerUserId(booking.photographer);
    if (!existingSuccessfulPayment) {
      await Payment.findOneAndUpdate(
        {
          booking: booking._id,
          transactionId: paymentPayload.transactionId ? String(paymentPayload.transactionId) : String(booking.payosOrderCode),
          paymentType: paymentPayload.paymentType || "DEPOSIT",
        },
        {
          $set: {
            booking: booking._id,
            sender: booking.customer,
            receiver: photographerUserId,
            amount,
            paymentType: paymentPayload.paymentType || "DEPOSIT",
            paymentMethod: paymentPayload.paymentMethod || "PAYOS",
            transactionId: paymentPayload.transactionId ? String(paymentPayload.transactionId) : String(booking.payosOrderCode),
            status: "SUCCESS",
            confirmedAt: new Date(),
            adminNote: paymentPayload.adminNote || "Payment confirmed",
          },
        },
        { upsert: true, new: true }
      );

      const photographerUserId = await resolvePhotographerUserId(booking.photographer);
      const wallet = await ensureWallet(photographerUserId);
      wallet.holdBalance = Number(wallet.holdBalance || 0) + amount;
      await wallet.save();

      const commissionAmount = Math.round(amount * COMMISSION_RATE);
      if (commissionAmount > 0) {
        await Commission.findOneAndUpdate(
          { booking: booking._id },
          {
            $setOnInsert: {
              booking: booking._id,
              photographer: booking.photographer,
              amount: commissionAmount,
              rate: COMMISSION_RATE,
              status: "PENDING",
            },
          },
          { upsert: true }
        ).catch(() => null);
      }
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidAmount = Math.max(Number(booking.paidAmount || 0), amount);
    booking.paidAt = booking.paidAt || new Date();
    pushStatusLog(booking, "PAYMENT_PAID", "Payment confirmed and moved to photographer escrow wallet");
    await booking.save();

    return booking;
  }

  async markBookingPaidByOrderCode(orderCode, payload = {}) {
    const booking = await Booking.findOne({ payosOrderCode: Number(orderCode) });
    if (!booking) {
      throw new Error("Booking not found for this PayOS order");
    }

    return this.markBookingPaid(booking, {
      amount: payload.amount,
      transactionId: orderCode,
      paymentMethod: "PAYOS",
      adminNote: "PayOS payment confirmed",
    });
  }

  async handlePayosWebhook(webhookBody) {
    const data = await getPayOS().webhooks.verify(webhookBody);
    if (!data || !data.orderCode) {
      throw new Error("Invalid PayOS webhook payload");
    }

    const code = String(data.code || webhookBody.code || "00");
    const status = String(data.status || "").toUpperCase();
    if (code === "00" || status === "PAID") {
      const booking = await this.markBookingPaidByOrderCode(data.orderCode, data);
      return { success: true, bookingId: booking._id };
    }

    return { success: true, ignored: true, orderCode: data.orderCode, status };
  }

  async syncPaymentStatus(bookingId, customerUserId, orderCode = null) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (String(booking.customer) !== String(customerUserId)) {
      throw new Error("You are not authorized to sync this payment");
    }

    if (isPaidStatus(booking.paymentStatus)) {
      return { booking, paid: true };
    }

    const payosId = orderCode || booking.payosOrderCode || booking.paymentLinkId;
    if (!payosId) {
      return { booking, paid: false, status: booking.paymentStatus };
    }

    const paymentInfo = await getPayOS().paymentRequests.get(payosId);
    const status = String(paymentInfo.status || "").toUpperCase();
    if (status === "PAID") {
      const paidBooking = await this.markBookingPaid(booking, {
        amount: paymentInfo.amountPaid || paymentInfo.amount || getBookingAmount(booking),
        transactionId: orderCode || booking.payosOrderCode,
        paymentMethod: "PAYOS",
        adminNote: "PayOS payment status synchronized",
      });
      return { booking: paidBooking, paid: true, status };
    }

    if (["CANCELLED", "EXPIRED"].includes(status)) {
      booking.paymentStatus = status === "EXPIRED" ? "expired" : "cancelled";
      pushStatusLog(booking, `PAYMENT_${status}`, `PayOS payment ${status.toLowerCase()}`);
      await booking.save();
    }

    return { booking, paid: false, status };
  }

  async completeBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to complete this booking");
    }

    const status = toLowerStatus(booking.status);
    if (!["confirmed", "deposit_paid", "in_progress"].includes(status)) {
      throw new Error("Booking can only be completed after payment is confirmed");
    }

    if (!isPaidStatus(booking.paymentStatus)) {
      throw new Error("Customer must complete payment before the project can be completed");
    }

    if (!booking.finalAlbum) {
      throw new Error("You must upload a final photo album before completing the booking");
    }

    const now = new Date();
    booking.status = "completed";
    booking.completionStatus = "photographer_completed";
    booking.completedAt = now;
    booking.submittedForApprovalAt = now;
    booking.autoCompleteAt = new Date(now.getTime() + APPROVAL_WINDOW_HOURS * 60 * 60 * 1000);
    booking.payoutEligibleAt = booking.autoCompleteAt;
    pushStatusLog(booking, "COMPLETED", "Photographer submitted final album for customer approval");
    await booking.save();

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (photographer) {
      photographer.completedBookings = (photographer.completedBookings || 0) + 1;
      photographer.totalEarnings = (photographer.totalEarnings || 0) + (booking.price || booking.totalPrice || 0);
      await photographer.save();
    }

    return booking;
  }

  async approveCompletion(bookingId, customerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.customer.toString() !== customerUserId.toString()) {
      throw new Error("You are not authorized to approve this booking");
    }

    if (booking.completionStatus !== "photographer_completed") {
      throw new Error("Booking is not waiting for customer approval");
    }

    const now = new Date();
    booking.completionStatus = "customer_approved";
    booking.customerApprovedAt = now;
    booking.payoutEligibleAt = now;
    pushStatusLog(booking, "PAYOUT_ELIGIBLE", "Customer approved the final album");
    await booking.save();

    await this.releaseEscrowToAvailable(booking);

    return booking;
  }

  async autoCompleteEligibleBookings(photographerUserId = null) {
    const now = new Date();
    const query = {
      completionStatus: "photographer_completed",
      autoCompleteAt: { $lte: now },
    };

    if (photographerUserId) {
      const identity = await getPhotographerIdentity(photographerUserId);
      query.photographer = { $in: identity.ids };
    }

    const bookings = await Booking.find(query);
    for (const booking of bookings) {
      booking.completionStatus = "auto_completed";
      booking.payoutEligibleAt = now;
      pushStatusLog(booking, "PAYOUT_ELIGIBLE", "Auto-completed after customer approval window");
      await booking.save();
      await this.releaseEscrowToAvailable(booking);
    }

    return bookings.length;
  }
}

module.exports = new BookingService();
