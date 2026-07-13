const mongoose = require("mongoose");

const loyaltyVoucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    pointsCost: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.LoyaltyVoucher || mongoose.model("LoyaltyVoucher", loyaltyVoucherSchema);
