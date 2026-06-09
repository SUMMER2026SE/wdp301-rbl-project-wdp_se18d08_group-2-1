const withdrawService = require("./withdraw.service");
const ApiResponse = require("../../../utils/ApiResponse");

class WithdrawController {
  async requestWithdraw(req, res) {
    try {
      const request = await withdrawService.createWithdrawRequest(req.user.id, req.body);
      return ApiResponse.success(res, request, "Withdraw request submitted successfully", 201);
    } catch (error) {
      console.error("Error creating withdraw request:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getWithdrawRequests(req, res) {
    try {
      const requests = await withdrawService.getRequests(req.user.id);
      return ApiResponse.success(res, requests, "Withdraw requests history retrieved successfully");
    } catch (error) {
      console.error("Error retrieving withdraw requests:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new WithdrawController();
