const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      default: 0,
    },
    style: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "completed"],
      default: "open",
    },
    referenceImages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

jobPostSchema.index({ status: 1, location: 1, style: 1 });

module.exports = mongoose.models.JobPost || mongoose.model("JobPost", jobPostSchema);
