const bookingService = require("./booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class BookingController {
  async acceptBooking(req, res) {
    try {
      const booking = await bookingService.acceptBooking(
        req.params.id,
        req.user._id
      );

      return ApiResponse.success(
        res,
        booking,
        "Booking accepted successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await bookingService.rejectBooking(id, req.user.id, reason);
      return ApiResponse.success(res, result.booking, result.message);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async completeBooking(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.completeBooking(id, req.user.id);
      return ApiResponse.success(res, booking, "Booking marked as completed successfully");
    } catch (error) {
      console.error("Error completing booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new BookingController();
