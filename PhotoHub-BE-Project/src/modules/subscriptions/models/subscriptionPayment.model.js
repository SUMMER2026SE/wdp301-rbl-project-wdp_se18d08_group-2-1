const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
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
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "VND",
    },
    billingType: {
      type: String,
      enum: ["MONTHLY", "PER_SESSION"],
      default: "MONTHLY",
    },
    paymentKind: {
      type: String,
      enum: ["PURCHASE", "RENEWAL", "PENALTY"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    provider: {
      type: String,
      enum: ["PAYOS", "MOCK", "WALLET", "MANUAL"],
      default: "PAYOS",
    },
    orderCode: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    paymentLinkId: {
      type: String,
      default: null,
    },
    paymentLink: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    payloadSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "subscriptionPayments",
  }
);

module.exports = mongoose.models.SubscriptionPayment || mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
