const mongoose = require("mongoose");

const featuredPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 30,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    collection: "featured_packages",
  }
);

module.exports = mongoose.models.FeaturedPackage || mongoose.model("FeaturedPackage", featuredPackageSchema);
