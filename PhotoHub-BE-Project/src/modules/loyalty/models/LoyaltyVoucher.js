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
      default: 0,
    },
    scope: {
      type: String,
      enum: ["PERSONAL", "GLOBAL"],
      default: "PERSONAL",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () { return this.scope === "PERSONAL"; },
      default: null,
      index: true,
    },
    sourceVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoyaltyVoucher",
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
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
