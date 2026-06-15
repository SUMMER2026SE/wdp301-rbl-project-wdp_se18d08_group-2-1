const bidService = require("./bid.service");
const ApiResponse = require("../../../utils/ApiResponse");

class BidController {
  async submitBid(req, res) {
    try {
      const bid = await bidService.createBid(req.user.id, req.body);
      return ApiResponse.success(res, bid, "Bid submitted successfully", 201);
    } catch (error) {
      console.error("Error submitting bid:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async updateBid(req, res) {
    try {
      const { id } = req.params;
      const bid = await bidService.updateBid(id, req.user.id, req.body);
      return ApiResponse.success(res, bid, "Bid updated successfully");
    } catch (error) {
      console.error("Error updating bid:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getMyBids(req, res) {
    try {
      const bids = await bidService.getMyBids(req.user.id);
      return ApiResponse.success(res, bids, "My bids retrieved successfully");
    } catch (error) {
      console.error("Error retrieving my bids:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new BidController();
