const recommendationService = require("./recommendation.service");
const ApiResponse = require("../../../utils/ApiResponse");

class RecommendationController {
  async getRecommendations(req, res) {
    try {
      const recommendations = await recommendationService.recommendJobsForPhotographer(req.user.id);
      return ApiResponse.success(res, recommendations, "Recommended jobs retrieved successfully");
    } catch (error) {
      console.error("Error retrieving recommendations:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new RecommendationController();
