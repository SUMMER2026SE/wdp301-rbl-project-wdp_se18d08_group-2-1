// photographers/models/photographerVerification.js

const mongoose = require("mongoose");

const photographerVerificationSchema = new mongoose.Schema(
  {
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "CCCD",
        "PASSPORT",
        "BUSINESS_LICENSE",
        "OTHER",
      ],
      required: true,
    },

    documentFrontUrl: {
      type: String,
      required: true,
    },

    documentBackUrl: String,

    status: {
      type: String,
      enum: [
        "PENDING",
        "VERIFIED",
        "REJECTED",
      ],
      default: "PENDING",
    },

    adminNote: String,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PhotographerVerification ||
  mongoose.model(
    "PhotographerVerification",
    photographerVerificationSchema
  );