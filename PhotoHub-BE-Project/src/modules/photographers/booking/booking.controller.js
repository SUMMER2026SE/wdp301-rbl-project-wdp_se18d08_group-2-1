const bookingService = require("./booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

const getRequestUserId = (req) => req.user?.id || req.user?._id;

class BookingController {
  async acceptBooking(req, res) {
    try {
      const booking = await bookingService.acceptBooking(req.params.id, getRequestUserId(req));
      return ApiResponse.success(res, booking, "Booking accepted successfully");
    } catch (error) {
      console.error("Error accepting booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await bookingService.rejectBooking(id, getRequestUserId(req), reason);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async completeBooking(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.completeBooking(id, getRequestUserId(req));
      return ApiResponse.success(res, booking, "Booking submitted for customer approval");
    } catch (error) {
      console.error("Error completing booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async approveCompletion(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.approveCompletion(id, getRequestUserId(req));
      return ApiResponse.success(res, booking, "Booking completion approved successfully");
    } catch (error) {
      console.error("Error approving booking completion:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new BookingController();
