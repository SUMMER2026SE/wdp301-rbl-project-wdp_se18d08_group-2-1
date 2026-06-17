const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    durationHours: {
      type: Number,
      required: true,
      min: 1,
    },

    editedPhotos: {
      type: Number,
      default: 0,
    },

    services: [
      {
        type: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Package ||
  mongoose.model("Package", packageSchema);