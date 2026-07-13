const mongoose = require("mongoose");

const loyaltyAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsAccumulatedYear: {
      type: Number,
      default: 0,
      min: 0,
    },
    membershipTier: {
      type: String,
      enum: ["Silver", "Gold", "Platinum"],
      default: "Silver",
    },
    referralCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referredByRewarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.LoyaltyAccount || mongoose.model("LoyaltyAccount", loyaltyAccountSchema);
