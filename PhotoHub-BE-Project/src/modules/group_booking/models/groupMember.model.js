/**
 * groupMember.model.js
 *
 * Schema lưu trữ thông tin từng thành viên trong một Group Booking.
 *
 * Vòng đời paymentStatus:
 *   PENDING → PAID     (sau khi thanh toán đặt cọc thành công)
 *   PAID    → REFUNDED (khi nhóm bị hủy hoặc thành viên rời nhóm)
 */

const mongoose = require("mongoose");

// ─── Enums ────────────────────────────────────────────────────────────────────

const MEMBER_ROLE = {
  LEADER: "LEADER",
  MEMBER: "MEMBER",
};

const MEMBER_PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const groupMemberSchema = new mongoose.Schema(
  {
    /** Nhóm mà thành viên này thuộc về */
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupBooking",
      required: true,
      index: true,
    },

    /** User tham gia nhóm */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Vai trò trong nhóm */
    role: {
      type: String,
      enum: Object.values(MEMBER_ROLE),
      default: MEMBER_ROLE.MEMBER,
    },

    /** Trạng thái thanh toán đặt cọc */
    paymentStatus: {
      type: String,
      enum: Object.values(MEMBER_PAYMENT_STATUS),
      default: MEMBER_PAYMENT_STATUS.PENDING,
      index: true,
    },

    /** Số tiền đặt cọc (bằng currentPrice của nhóm tại thời điểm join) */
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Thời điểm thanh toán đặt cọc thành công */
    paidAt: {
      type: Date,
      default: null,
    },

    /** Thời điểm được hoàn tiền */
    refundedAt: {
      type: Date,
      default: null,
    },

    /** Mã đơn hàng PayOS — dùng để tra cứu webhook */
    payosOrderCode: {
      type: Number,
      default: null,
    },

    /** Link thanh toán PayOS */
    paymentLink: {
      type: String,
      default: null,
    },

    /** ID link thanh toán PayOS */
    paymentLinkId: {
      type: String,
      default: null,
    },

    /** Số tiền thực tế đã được hoàn */
    refundedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────

/** Đảm bảo mỗi user chỉ có một slot trong một nhóm */
groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

/** Sparse index cho payosOrderCode — tra cứu nhanh qua webhook */
groupMemberSchema.index({ payosOrderCode: 1 }, { unique: true, sparse: true });

/** Query thành viên PAID của một nhóm */
groupMemberSchema.index({ group: 1, paymentStatus: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  GroupMember:
    mongoose.models.GroupMember ||
    mongoose.model("GroupMember", groupMemberSchema),
  MEMBER_ROLE,
  MEMBER_PAYMENT_STATUS,
};
