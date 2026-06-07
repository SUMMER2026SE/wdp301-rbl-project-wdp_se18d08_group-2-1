const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COLLECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
    collection: "commissions",
  }
);

module.exports = mongoose.models.Commission || mongoose.model("Commission", commissionSchema);
