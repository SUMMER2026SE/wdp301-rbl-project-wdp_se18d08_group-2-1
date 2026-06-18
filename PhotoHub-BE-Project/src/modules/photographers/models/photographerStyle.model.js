const mongoose = require("mongoose");

const photographerStyleSchema = new mongoose.Schema(
  {
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },

    styleTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StyleTag",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

photographerStyleSchema.index(
  { photographer: 1, styleTag: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PhotographerStyle ||
  mongoose.model(
    "PhotographerStyle",
    photographerStyleSchema
  );