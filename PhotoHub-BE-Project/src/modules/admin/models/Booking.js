const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DEPOSIT_PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"],
      default: "PENDING",
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    durationHours: {
      type: Number,
      default: 2,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      default: 0.10, // 10% mặc định
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    photographerPayout: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    statusLogs: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    collection: "bookings",
  }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
