const mongoose = require("mongoose");

const packageCategorySchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShootingCategory",
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// chống trùng (1 package không gắn 2 lần cùng category)
packageCategorySchema.index(
  { packageId: 1, categoryId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PackageCategory ||
  mongoose.model("PackageCategory", packageCategorySchema);