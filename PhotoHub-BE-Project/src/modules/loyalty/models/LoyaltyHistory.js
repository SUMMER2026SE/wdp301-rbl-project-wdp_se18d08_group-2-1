const mongoose = require("mongoose");

const loyaltyHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Earn_Booking", "Earn_Review", "Earn_Referral", "Redeem_Voucher", "Redeem_Addon"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.LoyaltyHistory || mongoose.model("LoyaltyHistory", loyaltyHistorySchema);
