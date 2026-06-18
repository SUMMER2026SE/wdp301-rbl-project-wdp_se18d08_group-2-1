const mongoose = require("mongoose");

const BOOKING_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CONFIRMED: "confirmed", // Đã thanh toán
  COMPLETED: "completed", // Đã chụp xong + upload album
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const bookingSchema = new mongoose.Schema(
  {
    // ─── Actors ────────────────────────────────────────────────────
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Gói dịch vụ (tuỳ chọn) ───────────────────────────────────
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      default: null,
    },

    // ─── Thông tin buổi chụp ───────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ─── Trạng thái ────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    rejectReason: {
      type: String,
      default: null,
    },

    // ─── PayOS Payment ─────────────────────────────────────────────
    payosOrderCode: {
      type: Number,
      default: null,
      sparse: true, // cho phép nhiều null cùng tồn tại
    },
    paymentLink: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // ─── Album & Completion ─────────────────────────────────────────
    finalAlbum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────
bookingSchema.index({ photographer: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ payosOrderCode: 1 }, { unique: true, sparse: true });
bookingSchema.index({ start: 1, end: 1 });

module.exports = {
  Booking: mongoose.models.Booking || mongoose.model("Booking", bookingSchema),
  BOOKING_STATUS,
};
