const WithdrawRequest = require("./withdrawRequest.model");
const revenueService = require("../revenue/revenue.service");

class WithdrawService {
  async createWithdrawRequest(photographerUserId, requestData) {
    const { amount, bankInfo } = requestData;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      throw new Error("Invalid withdraw amount");
    }

    if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
      throw new Error("Missing bank information");
    }

    const stats = await revenueService.getRevenueData(photographerUserId);
    if (Number(amount) > stats.withdrawableAmount) {
      throw new Error("Insufficient withdrawable balance. Please note pending withdrawal requests.");
    }

    const commissionRate = 0.1;
    const commission = Number(amount) * commissionRate;
    const finalAmount = Number(amount) - commission;

    const request = new WithdrawRequest({
      photographerId: photographerUserId,
      amount: Number(amount),
      commission,
      finalAmount,
      bankInfo,
      status: "pending",
    });

    return await request.save();
  }

  async getRequests(photographerUserId) {
    return await WithdrawRequest.find({ photographerId: photographerUserId }).sort({ createdAt: -1 });
  }
}

module.exports = new WithdrawService();
