const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
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
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPackage",
      required: true,
    },
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "PAUSED",
        "CANCELLED",
        "EXPIRED",
        "PENDING_PAYMENT",
        "RENEWING",
        "PENDING_CANCEL",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    billingType: {
      type: String,
      enum: ["MONTHLY", "PER_SESSION"],
      default: "MONTHLY",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    commitmentMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionsPerMonth: {
      type: Number,
      required: true,
      min: 1,
    },
    usedSessions: {
      type: Number,
      default: 0,
    },
    currentCycleStart: {
      type: Date,
      required: true,
    },
    currentCycleEnd: {
      type: Date,
      required: true,
    },
    nextResetDate: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    pauseUntil: {
      type: Date,
      default: null,
    },
    pausedDaysTotal: {
      type: Number,
      default: 0,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    lastPaymentAmount: {
      type: Number,
      default: 0,
    },
    penaltyPaid: {
      type: Number,
      default: 0,
    },
    cancelPenaltyAmount: {
      type: Number,
      default: 0,
    },
    lastPaymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED", null],
      default: null,
    },
    lastPaymentAt: {
      type: Date,
      default: null,
    },
    lastPaymentOrderCode: {
      type: Number,
      default: null,
    },
    preferredSchedule: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    bookingLocationPreference: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    commitmentSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  }
);

subscriptionSchema.index({ customer: 1, status: 1 });
subscriptionSchema.index({ photographer: 1, status: 1 });

module.exports = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
