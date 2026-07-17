// photographers/models/photographer.js

const mongoose = require("mongoose");

const photographerSchema = new mongoose.Schema(
  {
    UUID: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    location: String,

    experienceYears: {
      type: Number,
      default: 0,
    },

    equipment: String,

    bio: String,

    socialLinks: {
      facebook: String,
      instagram: String,
      website: String,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    completedBookings: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    hourlyRate: {
      type: Number,
      default: 0,
    },

    monthlySubscriptionCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Photographer || mongoose.model("Photographer", photographerSchema);
