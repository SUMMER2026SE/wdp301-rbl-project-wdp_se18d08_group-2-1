const mongoose = require("mongoose");

const marketingEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    location: {
      type: String,
      default: "Việt Nam",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.MarketingEvent || mongoose.model("MarketingEvent", marketingEventSchema);
