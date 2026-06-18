const mongoose = require("mongoose");

const photographerCategorySchema = new mongoose.Schema(
  {
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShootingCategory",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

photographerCategorySchema.index(
  { photographer: 1, category: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PhotographerCategory ||
  mongoose.model(
    "PhotographerCategory",
    photographerCategorySchema
  );