const bookingService = require("./booking.service");
const ApiResponse = require("../../../utils/ApiResponse");

class BookingController {
  async acceptBooking(req, res) {
    try {
      const { id } = req.params;
      const result = await bookingService.acceptBooking(id, req.user.id);
      return ApiResponse.success(res, result, "Booking accepted and consultation chat opened successfully");
    } catch (error) {
      console.error("Error accepting booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async rejectBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await bookingService.rejectBooking(id, req.user.id, reason);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async createPaymentLink(req, res) {
    try {
      const { id } = req.params;
      const result = await bookingService.createPaymentLink(id, req.user.id);
      return ApiResponse.success(res, result, "Payment link created successfully");
    } catch (error) {
      console.error("Error creating booking payment link:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async syncPaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await bookingService.syncPaymentStatus(
        id,
        req.user.id,
        req.query.orderCode || req.body?.orderCode
      );
      return ApiResponse.success(res, result, "Payment status synchronized successfully");
    } catch (error) {
      console.error("Error syncing booking payment:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async handlePayosWebhook(req, res) {
    try {
      const result = await bookingService.handlePayosWebhook(req.body);
      return res.status(200).json({
        success: true,
        message: "Webhook processed",
        data: result,
      });
    } catch (error) {
      console.error("Error handling PayOS webhook:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
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

  async approveCompletion(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.approveCompletion(id, req.user.id);
      return ApiResponse.success(res, booking, "Project completion approved successfully");
    } catch (error) {
      console.error("Error approving booking completion:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new BookingController();
