const mongoose = require("mongoose");

const favoritePhotographerSchema =
  new mongoose.Schema(
    {
      UUID: {
        type: String,
        required: true,
        unique: true,
      },

      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },

      photographer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photographer",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "FavoritePhotographer",
  favoritePhotographerSchema
);