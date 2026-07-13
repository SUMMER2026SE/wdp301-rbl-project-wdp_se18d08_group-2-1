const mongoose = require("mongoose");

const BOOKING_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  DRAFT: "draft",
  RESCHEDULED: "rescheduled",
  NEED_RESCHEDULE: "need_reschedule",
};

const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    subscriptionBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionBooking",
      default: null,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      default: null,
    },
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
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    rejectReason: {
      type: String,
      default: null,
    },
    statusLogs: [
      {
        status: {
          type: String,
          required: true,
        },
        note: {
          type: String,
          default: "",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    payosOrderCode: {
      type: Number,
      default: null,
      sparse: true,
    },
    paymentLinkId: {
      type: String,
      default: null,
    },
    paymentLink: {
      type: String,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    finalAlbum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    completionStatus: {
      type: String,
      enum: ["pending", "album_uploaded", "completed"],
      default: "pending",
    },
    deliveryDeadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    payoutEligibleAt: {
      type: Date,
      default: null,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    appliedVoucherCode: {
      type: String,
      default: null,
    },
    appliedAddonReward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoyaltyAddonReward",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ photographer: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ payosOrderCode: 1 }, { unique: true, sparse: true });
bookingSchema.index({ start: 1, end: 1 });
bookingSchema.index({ paymentStatus: 1, status: 1 });

module.exports = {
  Booking: mongoose.models.Booking || mongoose.model("Booking", bookingSchema),
  BOOKING_STATUS,
  PAYMENT_STATUS,
};
