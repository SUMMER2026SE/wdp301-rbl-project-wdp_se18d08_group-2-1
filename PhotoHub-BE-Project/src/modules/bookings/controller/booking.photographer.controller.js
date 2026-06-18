/**
 * booking.photographer.controller.js
 * Xử lý các request của PHOTOGRAPHER liên quan đến Booking.
 *
 * Endpoints:
 *   GET  /api/bookings/photographer/my          → getMyBookings
 *   PUT  /api/bookings/:id/accept               → acceptBooking
 *   PUT  /api/bookings/:id/reject               → rejectBooking
 *   PUT  /api/bookings/:id/complete             → completeBooking
 */

const bookingService = require("../services/booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class PhotographerBookingController {
  /**
   * GET /api/bookings/photographer/my?status=pending&page=1&limit=10
   * Photographer xem danh sách booking được đặt cho mình
   */
  async getMyBookings(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await bookingService.getBookingsForPhotographer(req.user.id, {
        status,
        page,
        limit,
      });
      return ApiResponse.success(res, result, "Lấy danh sách booking thành công");
    } catch (error) {
      console.error("[PhotographerBooking] getMyBookings:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/bookings/:id/accept
   * Photographer chấp nhận booking, notify Customer qua Socket.IO
   */
  async acceptBooking(req, res) {
    try {
      const booking = await bookingService.acceptBooking(req.params.id, req.user.id);
      return ApiResponse.success(res, booking, "Đã chấp nhận booking thành công");
    } catch (error) {
      console.error("[PhotographerBooking] acceptBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/bookings/:id/reject
   * Photographer từ chối booking kèm lý do, notify Customer qua Socket.IO
   */
  async rejectBooking(req, res) {
    try {
      const { reason } = req.body;
      const booking = await bookingService.rejectBooking(req.params.id, req.user.id, reason);
      return ApiResponse.success(res, booking, "Đã từ chối booking");
    } catch (error) {
      console.error("[PhotographerBooking] rejectBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/bookings/:id/complete
   * Photographer đánh dấu booking đã hoàn thành (cần upload album trước)
   */
  async completeBooking(req, res) {
    try {
      const booking = await bookingService.completeBooking(req.params.id, req.user.id);
      return ApiResponse.success(res, booking, "Booking đã được đánh dấu hoàn thành");
    } catch (error) {
      console.error("[PhotographerBooking] completeBooking:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new PhotographerBookingController();
