const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["DEPOSIT", "FINAL", "REFUND", "WITHDRAW"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["VNPAY", "PAYOS", "WALLET", "MANUAL"],
      default: "MANUAL",
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    adminNote: {
      type: String,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    confirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
