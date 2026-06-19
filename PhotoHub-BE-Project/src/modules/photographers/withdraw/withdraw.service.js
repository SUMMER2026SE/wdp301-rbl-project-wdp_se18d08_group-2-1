const WithdrawRequest = require("./withdrawRequest.model");
const revenueService = require("../revenue/revenue.service");
const Photographer = require("../models/photographer");
const Wallet = require("../../admin/models/Wallet");

class WithdrawService {
  async createWithdrawRequest(photographerUserId, requestData) {
    const { amount, bankInfo } = requestData;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      throw new Error("Invalid withdraw amount");
    }

    if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
      throw new Error("Missing bank information");
    }

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) {
      throw new Error("Photographer profile not found");
    }

    const stats = await revenueService.getRevenueData(photographerUserId);
    if (Number(amount) > stats.withdrawableAmount) {
      throw new Error("Insufficient withdrawable balance. Please note pending withdrawal requests.");
    }

    if (!stats.eligibleBookingIds || stats.eligibleBookingIds.length === 0) {
      throw new Error("No completed, paid, dispute-free bookings are eligible for payout yet.");
    }

    const commissionRate = stats.commissionRate || 0.1;
    const commission = Number(amount) * commissionRate;
    const finalAmount = Number(amount) - commission;
    await Wallet.findOneAndUpdate(
      { user: photographerUserId },
      { $setOnInsert: { user: photographerUserId, currency: "VND", balance: stats.withdrawableAmount, holdBalance: stats.escrowAmount || 0 } },
      { new: true, upsert: true }
    );

    const wallet = await Wallet.findOneAndUpdate(
      { user: photographerUserId, balance: { $gte: Number(amount) } },
      {
        $inc: {
          balance: -Number(amount),
          holdBalance: Number(amount),
        },
      },
      { new: true }
    );

    if (!wallet) {
      throw new Error("Insufficient wallet balance. Please refresh revenue data and try again.");
    }

    try {
      const request = new WithdrawRequest({
      photographerId: photographerUserId,
      photographer: photographer._id,
      wallet: wallet._id,
      amount: Number(amount),
      commission,
      commissionRate,
      finalAmount,
      eligibleBookingIds: stats.eligibleBookingIds,
      bankInfo,
      bankName: bankInfo.bankName,
      bankAccountNumber: bankInfo.accountNumber,
      bankAccountName: bankInfo.accountName,
      status: "PENDING",
      });

      return await request.save();
    } catch (error) {
      await Wallet.findOneAndUpdate(
        { _id: wallet._id },
        {
          $inc: {
            balance: Number(amount),
            holdBalance: -Number(amount),
          },
        }
      );
      throw error;
    }
  }

  async getRequests(photographerUserId) {
    const photographer = await Photographer.findOne({ user: photographerUserId }).select("_id");
    const query = photographer
      ? { $or: [{ photographerId: photographerUserId }, { photographer: photographer._id }] }
      : { photographerId: photographerUserId };

    return await WithdrawRequest.find(query).sort({ createdAt: -1 });
  }
}

module.exports = new WithdrawService();
