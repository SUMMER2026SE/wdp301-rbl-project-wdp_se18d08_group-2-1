/**
 * booking.customer.controller.js
 * Xá»­ lĂ½ cĂ¡c request cá»§a CUSTOMER liĂªn quan Ä‘áº¿n Booking.
 *
 * Endpoints:
 *   POST   /api/bookings              â†’ createBooking
 *   GET    /api/bookings/my           â†’ getMyBookings
 *   GET    /api/bookings/:id          â†’ getBookingDetail
 *   PUT    /api/bookings/:id/cancel   â†’ cancelBooking
 *   POST   /api/bookings/:id/payment  â†’ createPaymentLink
 *   POST   /api/bookings/webhook/payos â†’ handlePayosWebhook
 */

const bookingService = require("../services/booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class CustomerBookingController {
  /**
   * POST /api/bookings
   * Customer táº¡o booking má»›i, notify Photographer qua Socket.IO
   */
  async createBooking(req, res) {
    try {
      const booking = await bookingService.createBooking(req.user.id, req.body);
      return ApiResponse.success(
        res,
        booking,
        "Äáº·t lá»‹ch thĂ nh cĂ´ng! Vui lĂ²ng chá» nhiáº¿p áº£nh gia xĂ¡c nháº­n.",
        201
      );
    } catch (error) {
      console.error("[CustomerBooking] createBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/bookings/my?status=pending&page=1&limit=10
   * Customer xem danh sĂ¡ch bookings cá»§a mĂ¬nh
   */
  async getMyBookings(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await bookingService.getBookingsForCustomer(req.user.id, {
        status,
        page,
        limit,
      });
      return ApiResponse.success(res, result, "Láº¥y danh sĂ¡ch booking thĂ nh cĂ´ng");
    } catch (error) {
      console.error("[CustomerBooking] getMyBookings:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/bookings/:id
   * Xem chi tiáº¿t má»™t booking (shared vá»›i photographer controller)
   */
  async getBookingDetail(req, res) {
    try {
      const booking = await bookingService.findById(req.params.id);
      if (!booking) {
        return ApiResponse.error(res, "Booking khĂ´ng tá»“n táº¡i", 404);
      }

      // Chá»‰ cho phĂ©p customer/photographer liĂªn quan hoáº·c admin xem
      const userId = req.user.id.toString();
      const isAllowed =
        booking.customer._id.toString() === userId ||
        (booking.photographer.user && booking.photographer.user.toString() === userId) ||
        booking.photographer._id.toString() === userId ||
        req.user.role === "admin";

      if (!isAllowed) {
        return ApiResponse.error(res, "Báº¡n khĂ´ng cĂ³ quyá» n xem booking nĂ y", 403);
      }

      return ApiResponse.success(res, booking, "Láº¥y chi tiáº¿t booking thĂ nh cĂ´ng");
    } catch (error) {
      console.error("[CustomerBooking] getBookingDetail:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/bookings/:id/cancel
   * Customer huá»· booking (chá»‰ khi pending hoáº·c accepted)
   */
  async cancelBooking(req, res) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
      return ApiResponse.success(res, booking, "ÄĂ£ huá»· booking thĂ nh cĂ´ng");
    } catch (error) {
      console.error("[CustomerBooking] cancelBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/bookings/:id/payment
   * Customer táº¡o link thanh toĂ¡n PayOS (booking pháº£i á»Ÿ tráº¡ng thĂ¡i accepted)
   */
  async createPaymentLink(req, res) {
    try {
      const result = await bookingService.createPaymentLink(req.params.id, req.user.id);
      return ApiResponse.success(res, result, "Táº¡o link thanh toĂ¡n thĂ nh cĂ´ng");
    } catch (error) {
      console.error("[CustomerBooking] createPaymentLink:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async syncPaymentStatus(req, res) {
    try {
      const result = await bookingService.syncPaymentStatus(
        req.params.id,
        req.user.id,
        req.query.orderCode || req.body.orderCode,
        req.query.canceled === "true" || req.body.canceled === true
      );
      return ApiResponse.success(res, result, "Payment status synchronized successfully");
    } catch (error) {
      console.error("[CustomerBooking] syncPaymentStatus:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async syncPaymentStatusByOrderCode(req, res) {
    try {
      const orderCode = req.query.orderCode || req.body.orderCode;
      const result = await bookingService.syncPaymentStatusByOrderCode(
        orderCode,
        req.user.id,
        req.query.canceled === "true" || req.body.canceled === true
      );
      return ApiResponse.success(res, result, "Payment status synchronized successfully");
    } catch (error) {
      console.error("[CustomerBooking] syncPaymentStatusByOrderCode:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/bookings/webhook/payos
   * Nháº­n callback tá»« PayOS sau khi thanh toĂ¡n.
   * KHĂ”NG cáº§n authentication â€” PayOS gá»i trá»±c tiáº¿p.
   * LuĂ´n tráº£ vá» 200 Ä‘á»ƒ PayOS khĂ´ng retry.
   */
  async handlePayosWebhook(req, res) {
    try {
      const result = await bookingService.handlePayosWebhook(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[CustomerBooking] PayOS Webhook error:", error.message);
      // Váº«n tráº£ 200 Ä‘á»ƒ PayOS khĂ´ng spam retry, log error phĂ­a server
      return res.status(200).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CustomerBookingController();
