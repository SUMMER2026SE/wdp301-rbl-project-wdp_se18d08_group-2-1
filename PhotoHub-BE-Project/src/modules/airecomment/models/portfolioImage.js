// src/modules/airecomment/models/portfolioImage.js

const mongoose = require("mongoose");

/**
 * PortfolioImage Schema — Lưu từng ảnh trong Album portfolio.
 * Mỗi ảnh có AI Embedding 512 chiều để hỗ trợ tìm kiếm Vector Search.
 */
const portfolioImageSchema = new mongoose.Schema(
  {
    // ── Album chứa ảnh này ─────────────────────────────────────────────────
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortfolioAlbum",
      required: [true, "album là bắt buộc"],
      index: true,
    },

    // ── Photographer (denormalized để query nhanh, không cần join album) ──
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: [true, "photographer là bắt buộc"],
      index: true,
    },

    // ── URL ảnh (Cloudinary / local) ───────────────────────────────────────
    image_url: {
      type: String,
      required: [true, "image_url là bắt buộc"],
      trim: true,
    },

    // ── Chú thích ảnh ─────────────────────────────────────────────────────
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Caption tối đa 500 ký tự"],
    },

    // ── Vector Embedding 512 chiều (AI CLIP) ───────────────────────────────
    embedding: {
      type: [Number],
      required: [true, "embedding là bắt buộc"],
      select: false, // Không trả về embedding trong query thông thường
      validate: {
        validator: (v) => v.length === 512,
        message: "Embedding phải có đúng 512 chiều",
      },
    },
  },
  {
    timestamps: true,
    collection: "portfolio_images",
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────
portfolioImageSchema.index({ album: 1, createdAt: -1 });
portfolioImageSchema.index({ photographer: 1, createdAt: -1 });

module.exports =
  mongoose.models.PortfolioImage ||
  mongoose.model("PortfolioImage", portfolioImageSchema);
