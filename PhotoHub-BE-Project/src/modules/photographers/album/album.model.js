const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    photographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        previewUrl: { type: String },
        watermarkUrl: { type: String },
        downloadUrl: { type: String },
        publicId: { type: String, required: true },
        originalName: String,
        size: Number,
        mimetype: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    accessPolicy: {
      watermarkPreview: { type: Boolean, default: true },
      fullHdLockedUntilPaid: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Album || mongoose.model("Album", albumSchema);
