const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["ALL", "CUSTOMER", "PHOTOGRAPHER", "SPECIFIC"],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return this.recipientType === "SPECIFIC";
      },
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["SYSTEM", "BOOKING", "VERIFICATION", "WALLET"],
      default: "SYSTEM",
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
