const revenueService = require("./revenue.service");
const ApiResponse = require("../../../utils/ApiResponse");

class RevenueController {
  async getRevenue(req, res) {
    try {
      const stats = await revenueService.getRevenueData(req.user.id);
      return ApiResponse.success(res, stats, "Revenue dashboard statistics retrieved successfully");
    } catch (error) {
      console.error("Error retrieving revenue stats:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new RevenueController();
