const loyaltyService = require("../services/loyalty.service");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const LoyaltyHistory = require("../models/LoyaltyHistory");
const LoyaltyVoucher = require("../models/LoyaltyVoucher");
const LoyaltyAddonReward = require("../models/LoyaltyAddonReward");
const ApiResponse = require("../../../utils/ApiResponse");

class LoyaltyController {
  async getMyAccount(req, res) {
    try {
      const userId = req.user.id;
      const account = await loyaltyService.getOrCreateAccount(userId);
      return ApiResponse.success(res, account, "Lấy thông tin tài khoản tích điểm thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getMyHistory(req, res) {
    try {
      const userId = req.user.id;
      const histories = await LoyaltyHistory.find({ userId }).sort({ createdAt: -1 });
      return ApiResponse.success(res, histories, "Lấy lịch sử biến động điểm thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getMyRewards(req, res) {
    try {
      const userId = req.user.id;
      const [vouchers, addons] = await Promise.all([
        LoyaltyVoucher.find({ userId }).sort({ createdAt: -1 }),
        LoyaltyAddonReward.find({ userId }).sort({ createdAt: -1 }),
      ]);
      return ApiResponse.success(res, { vouchers, addons }, "Lấy danh sách quà đổi thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async redeemReward(req, res) {
    try {
      const userId = req.user.id;
      const { rewardType } = req.body;

      if (!rewardType) {
        return ApiResponse.error(res, "Cần chọn loại quà để đổi (rewardType)", 400);
      }

      if (rewardType.startsWith("VOUCHER_")) {
        const voucher = await loyaltyService.redeemVoucher(userId, rewardType);
        return ApiResponse.success(res, voucher, "Đổi mã giảm giá thành công");
      } else {
        const addon = await loyaltyService.redeemAddon(userId, rewardType);
        return ApiResponse.success(res, addon, "Đổi tiện ích tặng kèm thành công");
      }
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async adminGetAccounts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const accounts = await LoyaltyAccount.find()
        .populate("userId", "fullName email phoneNumber")
        .sort({ totalPointsAccumulatedYear: -1 })
        .skip(skip)
        .limit(limit);

      const total = await LoyaltyAccount.countDocuments();

      return ApiResponse.success(res, {
        accounts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }, "Lấy danh sách tài khoản tích điểm thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async adminGetHistories(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const histories = await LoyaltyHistory.find()
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await LoyaltyHistory.countDocuments();

      return ApiResponse.success(res, {
        histories,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }, "Lấy nhật ký điểm thưởng thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new LoyaltyController();
