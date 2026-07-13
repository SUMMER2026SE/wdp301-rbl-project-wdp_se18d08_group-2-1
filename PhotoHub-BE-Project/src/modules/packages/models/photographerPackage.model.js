const mongoose = require("mongoose");

const photographerPackageSchema = new mongoose.Schema(
  {
    photographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    packageType: {
      type: String,
      enum: ["SHOOTING", "MONTHLY"],
      default: "SHOOTING",
      index: true,
    },

    price: {
      type: Number,
      required: true,
    },

    durationHours: {
      type: Number,
      default: 0,
    },

    numberOfPhotos: {
      type: Number,
      default: 0,
    },

    editedPhotos: {
      type: Number,
      default: 0,
    },

    locationType: {
      type: String,
      enum: ["STUDIO", "OUTDOOR", "CUSTOMER_LOCATION", "ANY"],
      default: "ANY",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DELETED"],
      default: "ACTIVE",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    /**
     * Đánh dấu đây là gói dành riêng cho Group Booking.
     * - true  → chỉ hiển thị trong trang Tạo nhóm
     * - false → chỉ hiển thị trong trang Đặt lịch thường
     */
    isGroupPackage: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PhotographerPackage ||
  mongoose.model("PhotographerPackage", photographerPackageSchema);
