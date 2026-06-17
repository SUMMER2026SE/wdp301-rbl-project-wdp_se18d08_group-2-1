const mongoose = require("mongoose");

const packageImageSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

module.exports =
  mongoose.models.PackageImage ||
  mongoose.model("PackageImage", packageImageSchema);