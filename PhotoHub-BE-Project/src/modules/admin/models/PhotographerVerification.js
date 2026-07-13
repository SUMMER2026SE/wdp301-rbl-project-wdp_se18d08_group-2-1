const mongoose = require("mongoose");

const photographerVerificationSchema = new mongoose.Schema(
  {
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idCardNumber: {
      type: String,
      required: true,
    },
    idCardFrontImage: {
      type: String,
      required: true,
    },
    idCardBackImage: {
      type: String,
      required: true,
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    certificates: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "photographer_verifications",
  }
);

module.exports = mongoose.models.PhotographerVerification || mongoose.model("PhotographerVerification", photographerVerificationSchema);
