const LoyaltyAccount = require("../models/LoyaltyAccount");
const LoyaltyHistory = require("../models/LoyaltyHistory");
const LoyaltyVoucher = require("../models/LoyaltyVoucher");
const LoyaltyAddonReward = require("../models/LoyaltyAddonReward");
const Commission = require("../../admin/models/Commission");
const { Booking } = require("../../bookings/models/booking.model");
const { User } = require("../../auth/models/User");

const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);

class LoyaltyService {
  async getOrCreateAccount(userId) {
    let account = await LoyaltyAccount.findOne({ userId });
    if (!account) {
      // Generate unique referral code
      const randSuffix = Math.floor(10 + Math.random() * 90);
      const code = `PH-${String(userId).slice(-6).toUpperCase()}-${randSuffix}`;
      
      account = await LoyaltyAccount.create({
        userId,
        points: 0,
        totalPointsAccumulatedYear: 0,
        membershipTier: null,
        referralCode: code,
      });
    }
    return account;
  }

  async addPoints(userId, basePoints, type, description, referenceId = null) {
    const account = await this.getOrCreateAccount(userId);
    
    // Determine tier multiplier
    let multiplier = 1.0;
    if (account.membershipTier === "Gold") {
      multiplier = 1.2;
    } else if (account.membershipTier === "Platinum") {
      multiplier = 1.5;
    }

    const pointsEarned = Math.round(basePoints * multiplier);
    if (pointsEarned <= 0) return { account, pointsEarned: 0 };

    account.points += pointsEarned;
    account.totalPointsAccumulatedYear += pointsEarned;

    // Evaluate tier upgrade
    if (account.totalPointsAccumulatedYear >= 5000) {
      account.membershipTier = "Platinum";
    } else if (account.totalPointsAccumulatedYear >= 1000) {
      account.membershipTier = "Gold";
    } else if (account.totalPointsAccumulatedYear > 0) {
      account.membershipTier = "Silver";
    } else {
      account.membershipTier = null;
    }

    await account.save();

    // Log point history
    await LoyaltyHistory.create({
      userId,
      points: pointsEarned,
      type,
      description: `${description} (Hạng ${account.membershipTier} - Hệ số ${multiplier}x)`,
      referenceId: referenceId ? String(referenceId) : null,
    });

    return { account, pointsEarned };
  }

  async deductPoints(userId, pointsToDeduct, type, description, referenceId = null) {
    const account = await this.getOrCreateAccount(userId);
    if (account.points < pointsToDeduct) {
      throw new Error("Không đủ điểm tích lũy để thực hiện giao dịch này");
    }

    account.points -= pointsToDeduct;
    await account.save();

    await LoyaltyHistory.create({
      userId,
      points: -pointsToDeduct,
      type,
      description,
      referenceId: referenceId ? String(referenceId) : null,
    });

    return account;
  }

  async redeemVoucher(userId, voucherType) {
    let cost = 0;
    let value = 0;
    let name = "";

    if (voucherType === "VOUCHER_50") {
      cost = 500;
      value = 50000;
      name = "Voucher giảm giá 50k";
    } else if (voucherType === "VOUCHER_100") {
      cost = 1000;
      value = 100000;
      name = "Voucher giảm giá 100k";
    } else {
      throw new Error("Loại voucher không hợp lệ");
    }

    // Deduct points
    await this.deductPoints(userId, cost, "Redeem_Voucher", `Đổi điểm lấy ${name}`);

    // Generate unique code
    const randCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `PH-REWARD-${randCode}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

    const voucher = await LoyaltyVoucher.create({
      code,
      discountAmount: value,
      pointsCost: cost,
      userId,
      isUsed: false,
      expiryDate,
    });

    return voucher;
  }

  async redeemAddon(userId, addonType) {
    let cost = 0;
    let description = "";

    if (addonType === "EXTRA_TIME") {
      cost = 300;
      description = "Thêm 30 phút chụp hình";
    } else if (addonType === "EXTRA_RETOUCH") {
      cost = 200;
      description = "Tặng thêm 5 ảnh retouch";
    } else {
      throw new Error("Loại tiện ích không hợp lệ");
    }

    // Deduct points
    await this.deductPoints(userId, cost, "Redeem_Addon", `Đổi điểm lấy tiện ích: ${description}`);

    const addonReward = await LoyaltyAddonReward.create({
      userId,
      pointsCost: cost,
      addonType,
      description,
      isUsed: false,
    });

    return addonReward;
  }

  async handleBookingCompleted(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // Calculate admin commission
    const commission = await Commission.findOne({ booking: bookingId });
    const commissionAmount = commission ? commission.amount : Math.round(booking.paidAmount * COMMISSION_RATE);

    // Convert 10% of commission to points
    // 100 VND of commission = 1 base point
    const basePoints = Math.floor((commissionAmount * 0.10) / 100);
    
    if (basePoints > 0) {
      await this.addPoints(
        booking.customer,
        basePoints,
        "Earn_Booking",
        `Tích lũy từ đơn chụp #${String(bookingId).slice(-6)}`,
        bookingId
      );
    }

    // Referral Trigger: Check if this is the customer's first completed booking
    const completedCount = await Booking.countDocuments({
      customer: booking.customer,
      status: "completed",
    });

    if (completedCount === 1) {
      const refereeAccount = await this.getOrCreateAccount(booking.customer);
      
      if (refereeAccount.referredBy && !refereeAccount.referredByRewarded) {
        // Fetch referee user detail
        const refereeUser = await User.findById(booking.customer).select("fullName email");
        const refereeName = refereeUser ? (refereeUser.fullName || refereeUser.email) : "Bạn bè";

        // Award 200 points to both referrer and referee
        await this.addPoints(
          booking.customer,
          200,
          "Earn_Referral",
          "Thưởng giới thiệu (Hoàn thành đơn đặt đầu tiên)",
          bookingId
        );

        await this.addPoints(
          refereeAccount.referredBy,
          200,
          "Earn_Referral",
          `Thưởng giới thiệu từ bạn bè: ${refereeName}`,
          bookingId
        );

        // Mark rewarded
        refereeAccount.referredByRewarded = true;
        await refereeAccount.save();
      }
    }
  }

  async getDiscountPercent(userId) {
    const account = await this.getOrCreateAccount(userId);
    if (account.membershipTier === "Gold") {
      return 0.05; // 5% discount
    } else if (account.membershipTier === "Platinum") {
      return 0.10; // 10% discount
    }
    return 0.0;
  }
}

module.exports = new LoyaltyService();
