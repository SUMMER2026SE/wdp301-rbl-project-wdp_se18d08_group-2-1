const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "confirmed", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    rejectReason: {
      type: String,
      default: null,
    },
    finalAlbum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ photographer: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
