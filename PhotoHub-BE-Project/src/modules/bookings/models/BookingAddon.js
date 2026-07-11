const mongoose = require("mongoose");

const bookingAddonSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    makeup: {
      type: Boolean,
      default: false,
    },
    costume: {
      type: Boolean,
      default: false,
    },
    studio: {
      type: Boolean,
      default: false,
    },
    makeupDetails: {
      type: String,
      default: "",
    },
    costumeDetails: {
      type: String,
      default: "",
    },
    studioDetails: {
      type: String,
      default: "",
    },
    addonPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.BookingAddon || mongoose.model("BookingAddon", bookingAddonSchema);
