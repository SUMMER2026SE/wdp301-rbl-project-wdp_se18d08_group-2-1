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
    },
    start: {
      type: Date,
    },
    end: {
      type: Date,
    },
    title: {
      type: String,
      default: "Photo session",
    },
    location: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    style: {
      type: String,
      default: "",
    },
    packageName: {
      type: String,
      default: "",
      required: true,
    },
    durationHours: {
      type: Number,
      default: 2,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
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
    rejectReason: {
      type: String,
      default: null,
    },
    suggestedSlots: [
      {
        start: Date,
        end: Date,
        score: Number,
        reason: String,
      },
    ],
    finalAlbum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    deliveryDeadline: {
      type: Date,
      default: null,
    },
    completionStatus: {
      type: String,
      enum: [
        "not_started",
        "album_uploaded",
        "photographer_completed",
        "customer_approved",
        "auto_completed",
        "disputed",
      ],
      default: "not_started",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    submittedForApprovalAt: {
      type: Date,
      default: null,
    },
    customerApprovedAt: {
      type: Date,
      default: null,
    },
    autoCompleteAt: {
      type: Date,
      default: null,
    },
    payoutEligibleAt: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "paid", "refunded"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
    collection: "bookings",
  }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
