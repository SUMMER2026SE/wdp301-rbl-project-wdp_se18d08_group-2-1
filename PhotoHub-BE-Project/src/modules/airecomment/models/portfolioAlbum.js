// src/modules/airecomment/models/portfolioAlbum.js

const mongoose = require("mongoose");

/**
 * PortfolioAlbum Schema — Lưu Album portfolio của Photographer.
 * Mỗi album chứa nhiều ảnh (PortfolioImage).
 */
const portfolioAlbumSchema = new mongoose.Schema(
  {
    // ── Photographer sở hữu album ──────────────────────────────────────────
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: [true, "photographer là bắt buộc"],
      index: true,
    },

    // ── Tiêu đề album ──────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Tiêu đề album là bắt buộc"],
      trim: true,
      maxlength: [150, "Tiêu đề tối đa 150 ký tự"],
    },

    // ── Mô tả album ────────────────────────────────────────────────────────
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Mô tả tối đa 1000 ký tự"],
    },

    // ── Ảnh bìa album (URL) ────────────────────────────────────────────────
    coverImageUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // ── Thể loại chụp (ref ShootingCategory) ──────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShootingCategory",
      default: null,
    },

    // ── Các style tags (ref StyleTag) ─────────────────────────────────────
    styleTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StyleTag",
      },
    ],

    // ── Gói giá (VNĐ) ─────────────────────────────────────────────────────
    price_package: {
      type: Number,
      required: [true, "price_package là bắt buộc"],
      min: [0, "price_package không được âm"],
    },

    // ── Hiển thị công khai ─────────────────────────────────────────────────
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "portfolio_albums",
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────
portfolioAlbumSchema.index({ photographer: 1, createdAt: -1 });
portfolioAlbumSchema.index({ category: 1 });
portfolioAlbumSchema.index({ price_package: 1 });

module.exports =
  mongoose.models.PortfolioAlbum ||
  mongoose.model("PortfolioAlbum", portfolioAlbumSchema);
