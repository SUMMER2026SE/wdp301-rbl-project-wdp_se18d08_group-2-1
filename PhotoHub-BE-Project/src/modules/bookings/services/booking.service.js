const { PayOS } = require("@payos/node");
const { Booking, BOOKING_STATUS, PAYMENT_STATUS } = require("../models/booking.model");
const Photographer = require("../../photographers/models/photographer");
const Payment = require("../../admin/models/Payment");
const Wallet = require("../../admin/models/Wallet");
const { getIO } = require("../../../socket");
const {
  sendBookingConfirmedToCustomer,
  sendBookingConfirmedToPhotographer,
} = require("../../../services/EmailService");

const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);
const PAYOUT_HOLD_DAYS = Number(process.env.PAYOUT_HOLD_DAYS || 0);
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

const safeEmit = (room, event, data) => {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    console.error(`[Socket] Failed to emit "${event}" to "${room}":`, err.message);
  }
};

const normalizeUrl = (baseUrl, path) => {
  const base = String(baseUrl || DEFAULT_FRONTEND_URL).replace(/\/$/, "");
  return `${base}${path}`;
};

const buildPaymentResultUrl = (configuredUrl, params = {}) => {
  const baseUrl = configuredUrl || normalizeUrl(DEFAULT_FRONTEND_URL, "/payment/result");
  try {
    const url = new URL(baseUrl, DEFAULT_FRONTEND_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  } catch (_error) {
    const query = new URLSearchParams(params).toString();
    const separator = String(baseUrl).includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${query}`;
  }
};

const getBookingAmount = (booking) => Number(booking.price || booking.totalPrice || 0);
const getPayoutEligibleAt = () => new Date(Date.now() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000);

class BookingService {
  async ensureWallet(userId) {
    return await Wallet.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, balance: 0, holdBalance: 0, currency: "VND" } },
      { new: true, upsert: true }
    );
  }

  async createPayOSPaymentLink(paymentData) {
    if (payos.paymentRequests?.create) {
      return await payos.paymentRequests.create(paymentData);
    }
    return await payos.createPaymentLink(paymentData);
  }

  async getPayOSPaymentLink(orderCodeOrPaymentLinkId) {
    if (payos.paymentRequests?.get) {
      return await payos.paymentRequests.get(orderCodeOrPaymentLinkId);
    }
    return await payos.getPaymentLinkInformation(orderCodeOrPaymentLinkId);
  }

  async verifyPayOSWebhook(webhookBody) {
    if (payos.webhooks?.verify) {
      return await payos.webhooks.verify(webhookBody);
    }
    return payos.verifyPaymentWebhookData(webhookBody);
  }

  async findById(bookingId) {
    return Booking.findById(bookingId)
      .populate("customer", "fullName email avatar phoneNumber")
      .populate("photographer", "fullName email avatar")
      .populate("package", "title price durationHours numberOfPhotos locationType");
  }

  async checkOverlap(photographerUserId, start, end, excludeBookingId = null) {
    const query = {
      photographer: photographerUserId,
      status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
      $or: [{ start: { $lt: end }, end: { $gt: start } }],
    };
    if (excludeBookingId) query._id = { $ne: excludeBookingId };
    return (await Booking.countDocuments(query)) > 0;
  }

  async createBooking(customerUserId, dto) {
    const { photographerUserId, packageId, title, note, start, end, location, price } = dto;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) throw new Error("Photographer profile not found");
    if (photographer.verificationStatus !== "VERIFIED") {
      throw new Error("Photographer is not verified yet");
    }
    if (!photographer.isAvailable) {
      throw new Error("Photographer is currently unavailable for new bookings");
    }

    const hasConflict = await this.checkOverlap(photographerUserId, startDate, endDate);
    if (hasConflict) {
      throw new Error("Photographer already has a confirmed booking in this time range");
    }

    const booking = await Booking.create({
      customer: customerUserId,
      photographer: photographerUserId,
      package: packageId || null,
      title: title.trim(),
      note: note?.trim() || null,
      start: startDate,
      end: endDate,
      location: location.trim(),
      price: Number(price),
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.UNPAID,
    });

    const populated = await this.findById(booking._id);

    safeEmit(`user:${photographerUserId}`, "new-booking-request", {
      bookingId: booking._id,
      customer: {
        id: customerUserId,
        fullName: populated.customer?.fullName,
        avatar: populated.customer?.avatar,
      },
      title,
      start: startDate,
      end: endDate,
      location,
      price,
      createdAt: booking.createdAt,
    });

    return populated;
  }

  async getBookingsForCustomer(customerUserId, { status, page = 1, limit = 10 } = {}) {
    const query = { customer: customerUserId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("photographer", "fullName email avatar")
        .populate("package", "title price durationHours")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async cancelBooking(bookingId, customerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (String(booking.customer) !== String(customerUserId)) {
      throw new Error("You are not allowed to cancel this booking");
    }
    if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED].includes(booking.status)) {
      throw new Error("Only pending or accepted bookings can be cancelled");
    }

    if (booking.payosOrderCode && booking.paymentStatus === PAYMENT_STATUS.PENDING) {
      try {
        if (payos.paymentRequests?.cancel) {
          await payos.paymentRequests.cancel(Number(booking.payosOrderCode), "Customer cancelled booking");
        } else if (payos.cancelPaymentLink) {
          await payos.cancelPaymentLink(Number(booking.payosOrderCode), "Customer cancelled booking");
        }
      } catch (error) {
        console.warn("[PayOS] Could not cancel payment link:", error.message);
      }
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.paymentStatus = booking.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.CANCELLED;
    await booking.save();

    safeEmit(`user:${booking.photographer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.CANCELLED,
      message: "Customer cancelled the booking",
    });

    return booking;
  }

  async createPaymentLink(bookingId, customerUserId) {
    const booking = await this.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (String(booking.customer._id) !== String(customerUserId)) {
      throw new Error("You are not allowed to pay this booking");
    }
    if (booking.status !== BOOKING_STATUS.ACCEPTED) {
      throw new Error("Booking must be accepted before payment");
    }
    if (booking.paymentStatus === PAYMENT_STATUS.PAID || booking.status === BOOKING_STATUS.CONFIRMED) {
      return { alreadyPaid: true, booking };
    }

    if (booking.paymentLink && booking.payosOrderCode && booking.paymentStatus === PAYMENT_STATUS.PENDING) {
      return {
        paymentLink: booking.paymentLink,
        checkoutUrl: booking.paymentLink,
        orderCode: booking.payosOrderCode,
        paymentLinkId: booking.paymentLinkId,
      };
    }

    const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
    const resultParams = { bookingId: booking._id, orderCode };

    const paymentData = {
      orderCode,
      amount: Math.round(getBookingAmount(booking)),
      description: `PhotoHub ${String(booking._id).slice(-8)}`.slice(0, 25),
      returnUrl: buildPaymentResultUrl(process.env.PAYOS_RETURN_URL, resultParams),
      cancelUrl: buildPaymentResultUrl(process.env.PAYOS_CANCEL_URL, { ...resultParams, canceled: true }),
      items: [
        {
          name: String(booking.title || "Photo booking").substring(0, 25),
          quantity: 1,
          price: Math.round(getBookingAmount(booking)),
        },
      ],
      buyerName: booking.customer?.fullName,
      buyerEmail: booking.customer?.email,
      buyerPhone: booking.customer?.phoneNumber,
    };

    const response = await this.createPayOSPaymentLink(paymentData);

    await Booking.findByIdAndUpdate(booking._id, {
      payosOrderCode: orderCode,
      paymentLinkId: response.paymentLinkId || response.id || null,
      paymentLink: response.checkoutUrl,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });

    return {
      paymentLink: response.checkoutUrl,
      checkoutUrl: response.checkoutUrl,
      orderCode,
      paymentLinkId: response.paymentLinkId || response.id || null,
      qrCode: response.qrCode,
      status: response.status,
    };
  }

  async markBookingPaidByOrderCode(orderCode, payosData = {}) {
    const booking = await Booking.findOne({ payosOrderCode: Number(orderCode) });
    if (!booking) throw new Error(`Booking not found for orderCode=${orderCode}`);
    return await this.markBookingPaid(booking, payosData);
  }

  async markBookingPaid(booking, payosData = {}) {
    const orderCode = Number(payosData.orderCode || booking.payosOrderCode);
    const amount = Number(payosData.amount || payosData.amountPaid || booking.price || 0);
    const wasPaid = booking.paymentStatus === PAYMENT_STATUS.PAID || [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(booking.status);
    const existingPayment = await Payment.findOne({ transactionId: String(orderCode), paymentType: "DEPOSIT" });
    const wasPaymentSuccess = existingPayment?.status === "SUCCESS";

    booking.status = booking.status === BOOKING_STATUS.COMPLETED ? BOOKING_STATUS.COMPLETED : BOOKING_STATUS.CONFIRMED;
    booking.paymentStatus = PAYMENT_STATUS.PAID;
    booking.paidAt = booking.paidAt || new Date();
    booking.paidAmount = Math.max(Number(booking.paidAmount || 0), amount || getBookingAmount(booking));
    booking.paymentLinkId = payosData.paymentLinkId || payosData.id || booking.paymentLinkId;
    await booking.save();

    if (existingPayment) {
      existingPayment.status = "SUCCESS";
      existingPayment.amount = existingPayment.amount || booking.paidAmount;
      existingPayment.confirmedAt = existingPayment.confirmedAt || new Date();
      existingPayment.paymentMethod = "PAYOS";
      existingPayment.adminNote = existingPayment.adminNote || "Confirmed by PayOS";
      await existingPayment.save();
    } else {
      await Payment.create({
        booking: booking._id,
        sender: booking.customer,
        receiver: booking.photographer,
        amount: booking.paidAmount,
        paymentType: "DEPOSIT",
        paymentMethod: "PAYOS",
        transactionId: String(orderCode),
        status: "SUCCESS",
        confirmedAt: new Date(),
        adminNote: "Confirmed by PayOS",
      });
    }

    if (!wasPaid && !wasPaymentSuccess) {
      await this.ensureWallet(booking.photographer);
      await Wallet.findOneAndUpdate(
        { user: booking.photographer },
        { $inc: { holdBalance: booking.paidAmount } },
        { new: true }
      );
      await Photographer.findOneAndUpdate(
        { user: booking.photographer },
        { $inc: { totalEarnings: booking.paidAmount } }
      );
    }

    const populated = await this.findById(booking._id);
    const socketPayload = {
      bookingId: booking._id,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paidAt: booking.paidAt,
      amount: booking.paidAmount,
    };
    safeEmit(`user:${String(booking.customer)}`, "booking-paid", socketPayload);
    safeEmit(`user:${String(booking.photographer)}`, "booking-paid", socketPayload);

    const emailData = {
      bookingId: populated._id,
      customerName: populated.customer?.fullName || "Customer",
      photographerName: populated.photographer?.fullName || "Photographer",
      title: populated.title,
      location: populated.location,
      start: populated.start,
      end: populated.end,
      price: populated.paidAmount || populated.price,
    };

    Promise.all([
      populated.customer?.email ? sendBookingConfirmedToCustomer(populated.customer.email, emailData) : Promise.resolve(),
      populated.photographer?.email ? sendBookingConfirmedToPhotographer(populated.photographer.email, emailData) : Promise.resolve(),
    ]).catch((err) => console.error("[Email] Booking confirmation failed:", err.message));

    return populated;
  }

  async handlePayosWebhook(webhookBody) {
    const verifiedData = await this.verifyPayOSWebhook(webhookBody);
    const data = verifiedData?.data || verifiedData;
    const orderCode = data?.orderCode;
    const code = data?.code || webhookBody?.code;

    if (!orderCode) throw new Error("PayOS webhook missing orderCode");
    if (String(code) !== "00") {
      return { skipped: true, orderCode, reason: "Payment not successful" };
    }

    const booking = await this.markBookingPaidByOrderCode(orderCode, data);
    return { success: true, bookingId: booking._id, orderCode };
  }

  async syncPaymentStatusByOrderCode(orderCode, customerUserId) {
    const code = Number(orderCode);
    if (!code) throw new Error("PayOS order code is required");

    const booking = await Booking.findOne({ payosOrderCode: code });
    if (!booking) throw new Error(`Booking not found for orderCode=${orderCode}`);

    return await this.syncPaymentStatus(booking._id, customerUserId, code);
  }

  async syncPaymentStatus(bookingId, customerUserId, orderCode = null) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (String(booking.customer) !== String(customerUserId)) {
      throw new Error("You are not allowed to check this booking payment");
    }

    if (booking.paymentStatus === PAYMENT_STATUS.PAID || [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
      return { paid: true, status: booking.status, paymentStatus: booking.paymentStatus, booking };
    }

    const code = Number(orderCode || booking.payosOrderCode);
    if (!code) throw new Error("This booking does not have a PayOS order code yet");

    const paymentLink = await this.getPayOSPaymentLink(code);
    if (paymentLink.status === "PAID" || Number(paymentLink.amountPaid || 0) >= getBookingAmount(booking)) {
      const paidBooking = await this.markBookingPaid(booking, paymentLink);
      return { paid: true, payosStatus: paymentLink.status, booking: paidBooking };
    }

    if (["CANCELLED", "EXPIRED", "FAILED"].includes(paymentLink.status)) {
      booking.paymentStatus = paymentLink.status === "EXPIRED" ? PAYMENT_STATUS.EXPIRED : PAYMENT_STATUS.CANCELLED;
      await booking.save();
    }

    return {
      paid: false,
      payosStatus: paymentLink.status,
      paymentStatus: booking.paymentStatus,
      booking,
    };
  }

  async getBookingsForPhotographer(photographerUserId, { status, page = 1, limit = 10 } = {}) {
    const query = { photographer: photographerUserId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("customer", "fullName email avatar phoneNumber")
        .populate("package", "title price durationHours")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async acceptBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (String(booking.photographer) !== String(photographerUserId)) {
      throw new Error("You are not allowed to accept this booking");
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new Error("Only pending bookings can be accepted");
    }

    const hasConflict = await this.checkOverlap(booking.photographer, booking.start, booking.end, booking._id);
    if (hasConflict) {
      throw new Error("This booking conflicts with another confirmed booking");
    }

    booking.status = BOOKING_STATUS.ACCEPTED;
    await booking.save();

    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.ACCEPTED,
      message: "Photographer accepted your booking. Please complete payment.",
    });

    return booking;
  }

  async rejectBooking(bookingId, photographerUserId, rejectReason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (String(booking.photographer) !== String(photographerUserId)) {
      throw new Error("You are not allowed to reject this booking");
    }
    if ([BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
      throw new Error("Booking is already rejected or cancelled");
    }
    if ([BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
      throw new Error("Cannot reject a paid booking");
    }

    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectReason = rejectReason?.trim() || "Photographer cannot take this booking";
    await booking.save();

    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.REJECTED,
      reason: booking.rejectReason,
    });

    return booking;
  }

  async completeBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (String(booking.photographer) !== String(photographerUserId)) {
      throw new Error("You are not allowed to complete this booking");
    }
    if (booking.status !== BOOKING_STATUS.CONFIRMED || booking.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error("Only paid and confirmed bookings can be completed");
    }
    if (!booking.finalAlbum) {
      throw new Error("Please upload the final album before marking this booking complete");
    }

    const amount = Number(booking.paidAmount || booking.price || 0);
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completionStatus = "completed";
    booking.completedAt = new Date();
    booking.payoutEligibleAt = getPayoutEligibleAt();
    await booking.save();

    const wallet = await this.ensureWallet(booking.photographer);
    const releasable = Math.min(Number(wallet.holdBalance || 0), amount);
    wallet.holdBalance = Math.max(0, Number(wallet.holdBalance || 0) - releasable);
    wallet.balance = Number(wallet.balance || 0) + amount;
    await wallet.save();

    await Photographer.findOneAndUpdate(
      { user: photographerUserId },
      { $inc: { completedBookings: 1 } }
    );

    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.COMPLETED,
      message: "Your final album is ready.",
    });

    return booking;
  }
}

module.exports = new BookingService();
