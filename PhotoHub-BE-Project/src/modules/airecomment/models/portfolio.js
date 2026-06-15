// src/modules/airecomment/models/portfolio.js

const mongoose = require("mongoose");

/**
 * Portfolio Schema — Lưu ảnh portfolio của Photographer kèm Vector Embedding.
 */
const portfolioSchema = new mongoose.Schema(
  {
    // ── Photographer sở hữu ảnh này ─────────────────────────────────────────
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: [true, "photographer_id là bắt buộc"],
      index: true,
    },

    // ── URL công khai của ảnh (Cloudinary / S3 / uploads local) ─────────────
    image_url: {
      type: String,
      required: [true, "image_url là bắt buộc"],
      trim: true,
    },

    // ── Mô tả ngắn về ảnh (tuỳ chọn) ──────────────────────────────────────
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Caption tối đa 500 ký tự"],
    },

    // ── Gói giá của photographer (đơn vị: VNĐ) ─────────────────────────────
    price_package: {
      type: Number,
      required: [true, "price_package là bắt buộc"],
      min: [0, "price_package không được âm"],
    },

    // ── Vector Embedding 512 chiều ──────────────────────────────────────────
    embedding: {
      type: [Number],
      required: [true, "embedding là bắt buộc"],
      select: false,
      validate: {
        validator: (v) => v.length === 512,
        message: "Embedding phải có đúng 512 chiều",
      },
    },
  },
  {
    timestamps: true,
    collection: "portfolios",
  }
);

// ── Indexes thông thường ──────────────────────────────────────────────────
portfolioSchema.index({ photographer: 1, createdAt: -1 });
portfolioSchema.index({ price_package: 1 });

module.exports =
  mongoose.models.Portfolio ||
  mongoose.model("Portfolio", portfolioSchema);
