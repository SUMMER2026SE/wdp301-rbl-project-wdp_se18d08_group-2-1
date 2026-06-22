const ReviewService = require("../service/review.service");
const ApiResponse = require("../../../utils/ApiResponse");

class ReviewController {
  async createReview(req, res) {
    try {
      const customerUserId = req.user.id;
      const bookingId = req.params.id;
      const { rating, comment } = req.body;

      const review = await ReviewService.createReview(customerUserId, bookingId, { rating, comment });
      return ApiResponse.success(res, review, "Review created successfully", 201);
    } catch (error) {
      console.error("[ReviewController] createReview:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getPhotographerReviews(req, res) {
    try {
      const photographerProfileId = req.params.id;
      const { page, limit } = req.query;

      const result = await ReviewService.getPhotographerReviews(photographerProfileId, { page, limit });
      return ApiResponse.success(res, result, "Reviews retrieved successfully");
    } catch (error) {
      console.error("[ReviewController] getPhotographerReviews:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new ReviewController();
