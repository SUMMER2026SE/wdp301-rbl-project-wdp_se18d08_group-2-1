/**
 * groupBooking.model.js
 *
 * Schema lưu trữ thông tin một "nhóm chụp ảnh chung" (Group Booking).
 *
 * Vòng đời trạng thái:
 *   PENDING → CONFIRMED (khi đủ minMembers + đã thanh toán)
 *   PENDING → CANCELED  (khi hết expireTime mà thiếu người, hoặc Leader hủy)
 */

const mongoose = require("mongoose");

// ─── Enums ────────────────────────────────────────────────────────────────────

const GROUP_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELED: "CANCELED",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const groupBookingSchema = new mongoose.Schema(
  {
    /** Mã nhóm ngẫu nhiên 6-8 ký tự (chữ hoa + số), dùng để mời bạn bè */
    groupCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    /**
     * Concept/Gói chụp ảnh mục tiêu.
     * Tham chiếu đến PhotographerPackage — đây là "concept" trong hệ thống hiện tại.
     */
    concept: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotographerPackage",
      required: true,
      index: true,
    },

    /** Nhiếp ảnh gia phụ trách concept này */
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photographer",
      required: true,
      index: true,
    },

    /** User tạo nhóm (LEADER) */
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Số lượng thành viên tối thiểu để chốt nhóm */
    minMembers: {
      type: Number,
      required: true,
      min: 2,
    },

    /** Số lượng thành viên tối đa của nhóm */
    maxMembers: {
      type: Number,
      required: true,
      min: 2,
    },

    /** Số lượng thành viên hiện tại có paymentStatus = PAID */
    currentMemberCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Giá gốc của concept (được chép lại để tránh thay đổi giá sau) */
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Giá thực tế sau khi áp dụng giảm giá bậc thang */
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /** % giảm giá hiện tại (0, 10, 15, 20) */
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /** Trạng thái của nhóm */
    status: {
      type: String,
      enum: Object.values(GROUP_STATUS),
      default: GROUP_STATUS.PENDING,
      index: true,
    },

    /** Thời gian hết hạn: sau mốc này nếu chưa đủ người → tự động hủy */
    expireTime: {
      type: Date,
      required: true,
      index: true,
    },

    /** Thời điểm nhóm được xác nhận (CONFIRMED) */
    confirmedAt: {
      type: Date,
      default: null,
    },

    /** Thời điểm nhóm bị hủy (CANCELED) */
    canceledAt: {
      type: Date,
      default: null,
    },

    /**
     * Lịch hẹn chính thức được tạo ra sau khi nhóm CONFIRMED.
     * Tham chiếu đến Booking thông thường.
     */
    scheduledBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    /** Ghi chú / mô tả thêm từ Leader */
    note: {
      type: String,
      default: null,
      trim: true,
    },

    /** Trạng thái bị khóa đăng ký bởi Leader */
    isLocked: {
      type: Boolean,
      default: false,
    },

    /** Ngày chụp ảnh chung (định dạng YYYY-MM-DD) */
    shootDate: {
      type: String,
      required: true,
    },

    /** Giờ bắt đầu chụp (định dạng HH:mm) */
    shootStartTime: {
      type: String,
      required: true,
    },

    /** Thời điểm bắt đầu chụp (Date) */
    start: {
      type: Date,
      required: true,
      index: true,
    },

    /** Thời điểm kết thúc chụp (Date) */
    end: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────

/** Query nhóm PENDING chưa hết hạn (cho Discover + Cron job) */
groupBookingSchema.index({ status: 1, expireTime: 1 });

/** Query nhóm của một photographer */
groupBookingSchema.index({ photographer: 1, status: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  GroupBooking:
    mongoose.models.GroupBooking ||
    mongoose.model("GroupBooking", groupBookingSchema),
  GROUP_STATUS,
};
