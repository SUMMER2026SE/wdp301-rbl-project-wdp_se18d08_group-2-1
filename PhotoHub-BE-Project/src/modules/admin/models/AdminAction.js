const mongoose = require("mongoose");

const adminActionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      // Ví dụ: LOCK_USER, UNLOCK_USER, APPROVE_PHOTOGRAPHER, RESOLVE_DISPUTE,...
    },
    targetType: {
      type: String,
      required: true,
      // Ví dụ: User, Photographer, Booking, Dispute,...
    },
    targetId: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "admin_actions",
  }
);

module.exports = mongoose.models.AdminAction || mongoose.model("AdminAction", adminActionSchema);
