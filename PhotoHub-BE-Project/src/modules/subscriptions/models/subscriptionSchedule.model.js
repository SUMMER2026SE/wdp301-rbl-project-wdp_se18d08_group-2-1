const mongoose = require("mongoose");

const subscriptionScheduleSchema = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    cycleIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    cycleStart: {
      type: Date,
      required: true,
    },
    cycleEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"],
      default: "ACTIVE",
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    generatedSessions: {
      type: Number,
      default: 0,
    },
    conflictSessions: {
      type: Number,
      default: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String,
      default: "system",
    },
    sessions: {
      type: [
        {
          booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
          },
          subscriptionBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionBooking",
          },
          sessionNumber: Number,
          scheduledStart: Date,
          scheduledEnd: Date,
          conflictReason: String,
          rescheduleRequired: {
            type: Boolean,
            default: false,
          },
          suggestedSlots: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
          },
          status: {
            type: String,
            enum: ["DRAFT", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NEED_RESCHEDULE"],
            default: "DRAFT",
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "subscriptionSchedules",
  }
);

subscriptionScheduleSchema.index({ subscription: 1, cycleIndex: 1 }, { unique: true });

module.exports = mongoose.models.SubscriptionSchedule || mongoose.model("SubscriptionSchedule", subscriptionScheduleSchema);
