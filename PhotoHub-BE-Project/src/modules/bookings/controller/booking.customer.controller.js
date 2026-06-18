/**
 * booking.customer.controller.js
 * Xử lý các request của CUSTOMER liên quan đến Booking.
 *
 * Endpoints:
 *   POST   /api/bookings              → createBooking
 *   GET    /api/bookings/my           → getMyBookings
 *   GET    /api/bookings/:id          → getBookingDetail
 *   PUT    /api/bookings/:id/cancel   → cancelBooking
 *   POST   /api/bookings/:id/payment  → createPaymentLink
 *   POST   /api/bookings/webhook/payos → handlePayosWebhook
 */

const bookingService = require("../services/booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class CustomerBookingController {
  /**
   * POST /api/bookings
   * Customer tạo booking mới, notify Photographer qua Socket.IO
   */
  async createBooking(req, res) {
    try {
      const booking = await bookingService.createBooking(req.user.id, req.body);
      return ApiResponse.success(
        res,
        booking,
        "Đặt lịch thành công! Vui lòng chờ nhiếp ảnh gia xác nhận.",
        201
      );
    } catch (error) {
      console.error("[CustomerBooking] createBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/bookings/my?status=pending&page=1&limit=10
   * Customer xem danh sách bookings của mình
   */
  async getMyBookings(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await bookingService.getBookingsForCustomer(req.user.id, {
        status,
        page,
        limit,
      });
      return ApiResponse.success(res, result, "Lấy danh sách booking thành công");
    } catch (error) {
      console.error("[CustomerBooking] getMyBookings:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/bookings/:id
   * Xem chi tiết một booking (shared với photographer controller)
   */
  async getBookingDetail(req, res) {
    try {
      const booking = await bookingService.findById(req.params.id);
      if (!booking) {
        return ApiResponse.error(res, "Booking không tồn tại", 404);
      }

      // Chỉ cho phép customer/photographer liên quan hoặc admin xem
      const userId = req.user.id.toString();
      const isAllowed =
        booking.customer._id.toString() === userId ||
        booking.photographer._id.toString() === userId ||
        req.user.role === "admin";

      if (!isAllowed) {
        return ApiResponse.error(res, "Bạn không có quyền xem booking này", 403);
      }

      return ApiResponse.success(res, booking, "Lấy chi tiết booking thành công");
    } catch (error) {
      console.error("[CustomerBooking] getBookingDetail:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/bookings/:id/cancel
   * Customer huỷ booking (chỉ khi pending hoặc accepted)
   */
  async cancelBooking(req, res) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
      return ApiResponse.success(res, booking, "Đã huỷ booking thành công");
    } catch (error) {
      console.error("[CustomerBooking] cancelBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/bookings/:id/payment
   * Customer tạo link thanh toán PayOS (booking phải ở trạng thái accepted)
   */
  async createPaymentLink(req, res) {
    try {
      const result = await bookingService.createPaymentLink(req.params.id, req.user.id);
      return ApiResponse.success(res, result, "Tạo link thanh toán thành công");
    } catch (error) {
      console.error("[CustomerBooking] createPaymentLink:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/bookings/webhook/payos
   * Nhận callback từ PayOS sau khi thanh toán.
   * KHÔNG cần authentication — PayOS gọi trực tiếp.
   * Luôn trả về 200 để PayOS không retry.
   */
  async handlePayosWebhook(req, res) {
    try {
      const result = await bookingService.handlePayosWebhook(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[CustomerBooking] PayOS Webhook error:", error.message);
      // Vẫn trả 200 để PayOS không spam retry, log error phía server
      return res.status(200).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CustomerBookingController();
