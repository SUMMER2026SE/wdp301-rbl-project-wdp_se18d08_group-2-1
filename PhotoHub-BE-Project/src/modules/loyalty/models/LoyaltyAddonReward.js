const mongoose = require("mongoose");

const loyaltyAddonRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pointsCost: {
      type: Number,
      required: true,
    },
    addonType: {
      type: String,
      enum: ["EXTRA_TIME", "EXTRA_RETOUCH"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.LoyaltyAddonReward || mongoose.model("LoyaltyAddonReward", loyaltyAddonRewardSchema);
