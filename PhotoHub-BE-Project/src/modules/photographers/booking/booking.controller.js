const bookingService = require("./booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class BookingController {
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
}

module.exports = new BookingController();
