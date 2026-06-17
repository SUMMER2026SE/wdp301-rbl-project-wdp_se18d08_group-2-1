const mongoose = require("mongoose");

const shootingCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    iconUrl: {
      type: String,
      default: null,
    },

    coverImageUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ShootingCategory ||
  mongoose.model(
    "ShootingCategory",
    shootingCategorySchema
  );