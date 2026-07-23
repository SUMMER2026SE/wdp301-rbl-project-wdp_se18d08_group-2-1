const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupBooking",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.GroupMessage ||
  mongoose.model("GroupMessage", groupMessageSchema);
