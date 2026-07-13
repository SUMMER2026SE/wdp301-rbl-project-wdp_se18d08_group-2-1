const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["PAYOS", "WALLET", "CARD", "BANK_TRANSFER", "MOCK"],
      default: "PAYOS",
    },
    type: {
      type: String,
      enum: ["CARD", "BANK", "EWALLET", "PAYOS", "WALLET", "MOCK"],
      default: "PAYOS",
    },
    displayName: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      default: null,
    },
    last4: {
      type: String,
      default: null,
    },
    expMonth: {
      type: Number,
      default: null,
    },
    expYear: {
      type: Number,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "paymentMethods",
  }
);

paymentMethodSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.models.PaymentMethod || mongoose.model("PaymentMethod", paymentMethodSchema);
