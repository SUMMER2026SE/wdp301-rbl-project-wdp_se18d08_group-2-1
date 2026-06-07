const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    holdBalance: {
      type: Number,
      default: 0, // Dùng ký quỹ khi đang có lịch booking chưa hoàn thành
    },
    currency: {
      type: String,
      default: "VND",
    },
  },
  {
    timestamps: true,
    collection: "wallets",
  }
);

module.exports = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
