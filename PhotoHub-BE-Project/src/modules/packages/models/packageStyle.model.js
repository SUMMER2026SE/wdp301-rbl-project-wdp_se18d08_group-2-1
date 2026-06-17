const mongoose = require("mongoose");

const packageStyleSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      required: true,
    },

    styleTagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StyleTag",
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// chống trùng
packageStyleSchema.index(
  { packageId: 1, styleTagId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PackageStyle ||
  mongoose.model("PackageStyle", packageStyleSchema);