/**
 * booking.service.js
 * Toàn bộ business logic cho module Bookings.
 * Dùng chung cho cả Customer và Photographer controllers.
 */

const { PayOS } = require("@payos/node");
const { Booking, BOOKING_STATUS } = require("../models/booking.model");
const Photographer = require("../../photographers/models/photographer");
const Payment = require("../../admin/models/Payment");
const { User } = require("../../auth/models/User");
const { getIO } = require("../../../socket");
const {
  sendBookingConfirmedToCustomer,
  sendBookingConfirmedToPhotographer,
} = require("../../../services/EmailService");

// ─── Khởi tạo PayOS client ─────────────────────────────────────────
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// ─── Utility: Emit socket an toàn (không throw) ───────────────────
const safeEmit = (room, event, data) => {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    console.error(`[Socket] Failed to emit "${event}" to "${room}":`, err.message);
  }
};

class BookingService {
  // ════════════════════════════════════════════════════════════════
  //  SHARED
  // ════════════════════════════════════════════════════════════════

  /**
   * Lấy chi tiết một booking (dùng chung).
   */
  async findById(bookingId) {
    return Booking.findById(bookingId)
      .populate("customer", "fullName email avatar phoneNumber")
      .populate("photographer", "fullName email avatar")
      .populate("package", "title price durationHours numberOfPhotos locationType");
  }

  /**
   * Kiểm tra xung đột lịch của photographer.
   * Chỉ check các booking ở trạng thái accepted/confirmed/completed.
   */
  async checkOverlap(photographerUserId, start, end, excludeBookingId = null) {
    const query = {
      photographer: photographerUserId,
      status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
      $or: [
        { start: { $lt: end }, end: { $gt: start } }, // bất kỳ phần nào giao nhau
      ],
    };
    if (excludeBookingId) query._id = { $ne: excludeBookingId };
    return (await Booking.countDocuments(query)) > 0;
  }

  // ════════════════════════════════════════════════════════════════
  //  CUSTOMER ACTIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * Tạo booking mới.
   * @param {string} customerUserId
   * @param {Object} dto
   */
  async createBooking(customerUserId, dto) {
    const { photographerUserId, packageId, title, note, start, end, location, price } = dto;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Kiểm tra photographer
    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) {
      throw new Error("Nhiếp ảnh gia không tồn tại");
    }
    if (photographer.verificationStatus !== "VERIFIED") {
      throw new Error("Nhiếp ảnh gia chưa được xác minh bởi hệ thống");
    }
    if (!photographer.isAvailable) {
      throw new Error("Nhiếp ảnh gia hiện không nhận lịch đặt mới");
    }

    // Kiểm tra lịch bị trùng (accepted+)
    const hasConflict = await this.checkOverlap(photographerUserId, startDate, endDate);
    if (hasConflict) {
      throw new Error("Nhiếp ảnh gia đã có lịch chụp trong khoảng thời gian này");
    }

    // Tạo booking
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
    });

    // Populate để trả về đầy đủ thông tin
    const populated = await this.findById(booking._id);

    // ── Realtime: Notify photographer ──
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

  /**
   * Danh sách bookings dành cho Customer.
   */
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

  /**
   * Customer huỷ booking (chỉ khi pending hoặc accepted).
   */
  async cancelBooking(bookingId, customerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.customer.toString() !== customerUserId.toString()) {
      throw new Error("Bạn không có quyền huỷ booking này");
    }
    if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED].includes(booking.status)) {
      throw new Error("Chỉ có thể huỷ booking ở trạng thái pending hoặc accepted");
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save();

    // Notify photographer
    safeEmit(`user:${booking.photographer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.CANCELLED,
      message: "Khách hàng đã huỷ lịch chụp",
    });

    return booking;
  }

  /**
   * Tạo link thanh toán PayOS.
   * Booking phải ở trạng thái accepted.
   */
  async createPaymentLink(bookingId, customerUserId) {
    const booking = await this.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.customer._id.toString() !== customerUserId.toString()) {
      throw new Error("Bạn không có quyền thanh toán booking này");
    }
    if (booking.status !== BOOKING_STATUS.ACCEPTED) {
      throw new Error("Booking phải được nhiếp ảnh gia chấp nhận trước khi thanh toán");
    }

    // Idempotency: đã tạo link thì trả về luôn
    if (booking.paymentLink && booking.payosOrderCode) {
      return {
        paymentLink: booking.paymentLink,
        orderCode: booking.payosOrderCode,
      };
    }

    // Tạo orderCode duy nhất (số nguyên <= Number.MAX_SAFE_INTEGER)
    const orderCode = Date.now();

    const paymentData = {
      orderCode,
      amount: Math.round(booking.price), // PayOS yêu cầu VND nguyên
      description: `PhotoHub #${booking._id.toString().slice(-6).toUpperCase()}`,
      items: [
        {
          name: booking.title.substring(0, 25), // PayOS giới hạn độ dài
          quantity: 1,
          price: Math.round(booking.price),
        },
      ],
      returnUrl:
        process.env.PAYOS_RETURN_URL ||
        `${process.env.FRONTEND_URL}/payment/result`,
      cancelUrl:
        process.env.PAYOS_CANCEL_URL ||
        `${process.env.FRONTEND_URL}/payment/result?canceled=true`,
    };

    const response = await payos.createPaymentLink(paymentData);

    // Lưu thông tin thanh toán vào booking
    await Booking.findByIdAndUpdate(bookingId, {
      payosOrderCode: orderCode,
      paymentLink: response.checkoutUrl,
    });

    return {
      paymentLink: response.checkoutUrl,
      orderCode,
      qrCode: response.qrCode,
    };
  }

  /**
   * Xử lý webhook PayOS — gọi từ controller webhook.
   */
  async handlePayosWebhook(webhookBody) {
    // 1. Xác thực chữ ký từ PayOS
    let verifiedData;
    try {
      verifiedData = payos.verifyPaymentWebhookData(webhookBody);
    } catch (err) {
      throw new Error(`Chữ ký PayOS không hợp lệ: ${err.message}`);
    }

    const { orderCode, code } = verifiedData;

    // Chỉ xử lý khi thanh toán THÀNH CÔNG (code = "00")
    if (code !== "00") {
      console.log(`[PayOS Webhook] orderCode=${orderCode} | code=${code} → bỏ qua`);
      return { skipped: true, reason: "Payment not successful" };
    }

    // 2. Tìm booking theo orderCode
    const booking = await this.findById(
      await Booking.findOne({ payosOrderCode: Number(orderCode) }).select("_id").lean()
        .then((b) => b?._id)
    );

    if (!booking) {
      throw new Error(`Không tìm thấy booking với orderCode=${orderCode}`);
    }

    // Idempotency: đã xử lý rồi thì bỏ qua
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      return { alreadyProcessed: true, bookingId: booking._id };
    }

    // 3. Cập nhật booking → confirmed + paidAt
    await Booking.findByIdAndUpdate(booking._id, {
      status: BOOKING_STATUS.CONFIRMED,
      paidAt: new Date(),
    });

    // 4. Tạo bản ghi Payment để lưu lịch sử
    await Payment.create({
      booking: booking._id,
      sender: booking.customer._id,
      receiver: booking.photographer._id,
      amount: booking.price,
      paymentType: "DEPOSIT",
      paymentMethod: "PAYOS",
      transactionId: String(orderCode),
      status: "SUCCESS",
      confirmedAt: new Date(),
    });

    // 5. Cộng doanh thu cho Photographer
    await Photographer.findOneAndUpdate(
      { user: booking.photographer._id },
      { $inc: { totalEarnings: booking.price } }
    );

    // 6. Realtime: Notify cả 2 bên
    const socketPayload = {
      bookingId: booking._id,
      status: BOOKING_STATUS.CONFIRMED,
      paidAt: new Date(),
    };
    safeEmit(`user:${booking.customer._id.toString()}`, "booking-paid", socketPayload);
    safeEmit(`user:${booking.photographer._id.toString()}`, "booking-paid", socketPayload);

    // 7. Gửi email xác nhận — bất đồng bộ, không chặn response
    const emailData = {
      bookingId: booking._id,
      customerName: booking.customer.fullName || "Khách hàng",
      photographerName: booking.photographer.fullName || "Nhiếp ảnh gia",
      title: booking.title,
      location: booking.location,
      start: booking.start,
      end: booking.end,
      price: booking.price,
    };

    Promise.all([
      sendBookingConfirmedToCustomer(booking.customer.email, emailData),
      sendBookingConfirmedToPhotographer(booking.photographer.email, emailData),
    ]).catch((err) => console.error("[Email] Gửi email xác nhận booking thất bại:", err.message));

    return { success: true, bookingId: booking._id };
  }

  // ════════════════════════════════════════════════════════════════
  //  PHOTOGRAPHER ACTIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * Danh sách bookings dành cho Photographer.
   */
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

  /**
   * Photographer chấp nhận booking.
   */
  async acceptBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new Error("Chỉ có thể chấp nhận booking ở trạng thái pending");
    }

    const hasConflict = await this.checkOverlap(
      booking.photographer,
      booking.start,
      booking.end,
      booking._id
    );
    if (hasConflict) {
      throw new Error("Có xung đột lịch với booking khác đang được xác nhận");
    }

    booking.status = BOOKING_STATUS.ACCEPTED;
    await booking.save();

    // Notify customer
    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.ACCEPTED,
      message: "Nhiếp ảnh gia đã chấp nhận lịch chụp! Vui lòng tiến hành thanh toán.",
    });

    return booking;
  }

  /**
   * Photographer từ chối booking.
   */
  async rejectBooking(bookingId, photographerUserId, rejectReason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
    if ([BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
      throw new Error("Booking đã bị từ chối hoặc huỷ trước đó");
    }
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Không thể từ chối booking đã thanh toán");
    }

    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectReason = rejectReason?.trim() || "Nhiếp ảnh gia không thể nhận lịch này";
    await booking.save();

    // Notify customer
    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.REJECTED,
      reason: booking.rejectReason,
    });

    return booking;
  }

  /**
   * Photographer đánh dấu hoàn thành (sau khi upload album).
   */
  async completeBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
    if (![BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
      throw new Error("Chỉ có thể hoàn thành booking ở trạng thái accepted hoặc confirmed");
    }
    if (!booking.finalAlbum) {
      throw new Error("Vui lòng upload album ảnh cuối trước khi đánh dấu hoàn thành");
    }

    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    // Cập nhật completedBookings counter
    await Photographer.findOneAndUpdate(
      { user: photographerUserId },
      { $inc: { completedBookings: 1 } }
    );

    // Notify customer
    safeEmit(`user:${booking.customer.toString()}`, "booking-status-updated", {
      bookingId: booking._id,
      status: BOOKING_STATUS.COMPLETED,
      message: "Album ảnh của bạn đã sẵn sàng!",
    });

    return booking;
  }
}

module.exports = new BookingService();
