const mongoose = require("mongoose");

/**
 * PortfolioImage schema.
 * Stores each image in a portfolio album and its 512-dimension embedding for vector search.
 */
const portfolioImageSchema = new mongoose.Schema(
  {
    // Album containing this image
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortfolioAlbum",
      required: [true, "album is required"],
      index: true,
    },

    // Photographer (denormalized for fast queries)
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: [true, "photographer is required"],
      index: true,
    },

    // Image URL (Cloudinary / local)
    image_url: {
      type: String,
      required: [true, "image_url is required"],
      trim: true,
    },

    // Image caption
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Caption tối đa 500 ký tự"],
    },

    // Vector embedding 512 dimensions
    embedding: {
      type: [Number],
      required: [true, "embedding is required"],
      select: false,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 512,
        message: "Embedding must have exactly 512 dimensions",
      },
    },
  },
  {
    timestamps: true,
    collection: "portfolio_images",
  }
);

// Indexes
portfolioImageSchema.index({ album: 1, createdAt: -1 });
portfolioImageSchema.index({ photographer: 1, createdAt: -1 });

module.exports =
  mongoose.models.PortfolioImage ||
  mongoose.model("PortfolioImage", portfolioImageSchema);
