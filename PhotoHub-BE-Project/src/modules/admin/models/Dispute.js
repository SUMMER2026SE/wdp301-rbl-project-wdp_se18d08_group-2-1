const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
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
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidenceImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"],
      default: "OPEN",
    },
    resolutionType: {
      type: String,
      enum: ["REFUND_FULL", "REFUND_PARTIAL", "RELEASE_PAYMENT", "REJECT"],
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    releaseAmount: {
      type: Number,
      default: 0,
    },
    resolutionNote: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "disputes",
  }
);

module.exports = mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema);
