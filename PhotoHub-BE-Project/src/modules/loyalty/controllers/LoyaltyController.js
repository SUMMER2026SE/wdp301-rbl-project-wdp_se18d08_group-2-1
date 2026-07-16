const loyaltyService = require("../services/loyalty.service");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const LoyaltyHistory = require("../models/LoyaltyHistory");
const LoyaltyVoucher = require("../models/LoyaltyVoucher");
const LoyaltyAddonReward = require("../models/LoyaltyAddonReward");
const ApiResponse = require("../../../utils/ApiResponse");
const { User } = require("../../auth/models/User");

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
        LoyaltyVoucher.find({ userId, scope: { $ne: "GLOBAL" } }).sort({ createdAt: -1 }),
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

  async getRewardCatalog(req, res) {
    try {
      const vouchers = await LoyaltyVoucher.find({
        scope: "GLOBAL", isActive: true, expiryDate: { $gt: new Date() },
        $expr: { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usedCount", "$usageLimit"] }] },
      }).select("code discountAmount pointsCost expiryDate usageLimit usedCount").sort({ pointsCost: 1 });
      return ApiResponse.success(res, { vouchers }, "Lấy danh mục đổi voucher thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async adminGetVouchers(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
      const skip = (page - 1) * limit;
      const filter = {};

      if (req.query.status === "used") {
        filter.$or = [{ scope: { $ne: "GLOBAL" }, isUsed: true }, { scope: "GLOBAL", usedCount: { $gt: 0 } }];
      }
      if (req.query.status === "available") {
        filter.expiryDate = { $gt: new Date() };
        filter.$or = [
          { scope: { $ne: "GLOBAL" }, isUsed: false },
          {
            scope: "GLOBAL", isActive: true,
            $expr: { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usedCount", "$usageLimit"] }] },
          },
        ];
      }
      if (req.query.status === "expired") filter.expiryDate = { $lte: new Date() };

      const [vouchers, total] = await Promise.all([
        LoyaltyVoucher.find(filter)
          .populate("userId", "fullName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        LoyaltyVoucher.countDocuments(filter),
      ]);

      return ApiResponse.success(res, {
        vouchers,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      }, "Lấy danh sách voucher thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async adminCreateVoucher(req, res) {
    try {
      const { code, discountAmount, pointsCost, userId, expiryDate, isUsed = false,
        scope = "GLOBAL", isActive = true, usageLimit } = req.body;
      const normalizedScope = scope === "PERSONAL" ? "PERSONAL" : "GLOBAL";
      const normalizedCode = String(code || "").trim().toUpperCase();
      const discount = Number(discountAmount);
      const cost = Number(pointsCost);
      const expiry = new Date(expiryDate);

      if (!normalizedCode || !expiryDate || (normalizedScope === "PERSONAL" && !userId)) {
        return ApiResponse.error(res, "Mã voucher, ngày hết hạn và người nhận (nếu tặng riêng) là bắt buộc", 400);
      }
      if (!Number.isFinite(discount) || discount <= 0 || !Number.isFinite(cost) || cost < 0) {
        return ApiResponse.error(res, "Giá trị giảm phải lớn hơn 0 và điểm đổi không được âm", 400);
      }
      if (normalizedScope === "GLOBAL" && cost <= 0) {
        return ApiResponse.error(res, "Voucher trong cửa hàng phải có điểm đổi lớn hơn 0", 400);
      }
      if (Number.isNaN(expiry.getTime())) {
        return ApiResponse.error(res, "Ngày hết hạn không hợp lệ", 400);
      }
      if (normalizedScope === "PERSONAL" && !(await User.exists({ _id: userId }))) {
        return ApiResponse.error(res, "Người nhận voucher không tồn tại", 404);
      }
      if (await LoyaltyVoucher.exists({ code: normalizedCode })) {
        return ApiResponse.error(res, "Mã voucher đã tồn tại", 409);
      }

      const voucher = await LoyaltyVoucher.create({
        code: normalizedCode, discountAmount: discount, pointsCost: cost,
        scope: normalizedScope,
        userId: normalizedScope === "PERSONAL" ? userId : null,
        expiryDate: expiry, isUsed: normalizedScope === "PERSONAL" && Boolean(isUsed),
        isActive: Boolean(isActive),
        usageLimit: normalizedScope === "GLOBAL" && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      });
      await voucher.populate("userId", "fullName email");
      return ApiResponse.success(res, voucher, "Tạo voucher thành công", 201);
    } catch (error) {
      if (error?.code === 11000) return ApiResponse.error(res, "Mã voucher đã tồn tại", 409);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async adminUpdateVoucher(req, res) {
    try {
      const voucher = await LoyaltyVoucher.findById(req.params.id);
      if (!voucher) return ApiResponse.error(res, "Không tìm thấy voucher", 404);

      const { code, discountAmount, pointsCost, userId, expiryDate, isUsed, scope, isActive, usageLimit } = req.body;
      if (code !== undefined) voucher.code = String(code).trim().toUpperCase();
      if (discountAmount !== undefined) voucher.discountAmount = Number(discountAmount);
      if (pointsCost !== undefined) voucher.pointsCost = Number(pointsCost);
      if (userId !== undefined) voucher.userId = userId;
      if (expiryDate !== undefined) voucher.expiryDate = new Date(expiryDate);
      if (isUsed !== undefined) voucher.isUsed = Boolean(isUsed);
      if (scope !== undefined) voucher.scope = scope === "PERSONAL" ? "PERSONAL" : "GLOBAL";
      if (isActive !== undefined) voucher.isActive = Boolean(isActive);
      if (usageLimit !== undefined) voucher.usageLimit = Number(usageLimit) > 0 ? Number(usageLimit) : null;
      if (voucher.scope === "GLOBAL") {
        voucher.userId = null;
        voucher.isUsed = false;
      }

      if (!voucher.code || !Number.isFinite(voucher.discountAmount) || voucher.discountAmount <= 0 ||
          !Number.isFinite(voucher.pointsCost) || voucher.pointsCost < 0 ||
          Number.isNaN(voucher.expiryDate.getTime())) {
        return ApiResponse.error(res, "Dữ liệu voucher không hợp lệ", 400);
      }
      if (voucher.scope === "GLOBAL" && voucher.pointsCost <= 0) {
        return ApiResponse.error(res, "Voucher trong cửa hàng phải có điểm đổi lớn hơn 0", 400);
      }
      if (voucher.scope === "PERSONAL" && !(await User.exists({ _id: voucher.userId }))) {
        return ApiResponse.error(res, "Người nhận voucher không tồn tại", 404);
      }

      await voucher.save();
      await voucher.populate("userId", "fullName email");
      return ApiResponse.success(res, voucher, "Cập nhật voucher thành công");
    } catch (error) {
      if (error?.code === 11000) return ApiResponse.error(res, "Mã voucher đã tồn tại", 409);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async adminDeleteVoucher(req, res) {
    try {
      const voucher = await LoyaltyVoucher.findByIdAndDelete(req.params.id);
      if (!voucher) return ApiResponse.error(res, "Không tìm thấy voucher", 404);
      return ApiResponse.success(res, { id: voucher._id }, "Xóa voucher thành công");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new LoyaltyController();
