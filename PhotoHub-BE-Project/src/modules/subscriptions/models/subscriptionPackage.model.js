const mongoose = require("mongoose");

const subscriptionPackageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    billingType: {
      type: String,
      enum: ["MONTHLY", "PER_SESSION"],
      default: "MONTHLY",
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    perSessionPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionsPerMonth: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    commitmentMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maxPauseDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    autoRenewDefault: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "subscriptionPackages",
  }
);

module.exports = mongoose.models.SubscriptionPackage || mongoose.model("SubscriptionPackage", subscriptionPackageSchema);
