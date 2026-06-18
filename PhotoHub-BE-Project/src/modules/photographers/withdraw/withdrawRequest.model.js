const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
    photographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
      default: 0.1,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    bankInfo: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.WithdrawRequest || mongoose.model("WithdrawRequest", withdrawRequestSchema);
