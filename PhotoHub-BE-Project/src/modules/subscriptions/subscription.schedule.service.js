const mongoose = require("mongoose");
const dayjs = require("dayjs");
const { Booking } = require("../bookings/models/booking.model");
const Photographer = require("../photographers/models/photographer");
const SubscriptionSchedule = require("./models/subscriptionSchedule.model");
const SubscriptionBooking = require("./models/subscriptionBooking.model");
const { BookingStatus, SubscriptionStatus } = require("./subscription.constants");
const {
  buildCycleWindow,
  sanitizePreferredSchedule,
  getCandidateDates,
  makeSuggestedSlots,
  getBookedRangesForPhotographer,
  rangesOverlap,
} = require("./subscription.helper");
const { getPhotographerIdentity } = require("../photographers/utils/photographerIdentity");

const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "accepted",
  "confirmed",
  "completed",
  "PENDING",
  "ACCEPTED",
  "DEPOSIT_PAID",
  "IN_PROGRESS",
  "COMPLETED",
  "DRAFT",
  "CONFIRMED",
  "RESCHEDULED",
  "NEED_RESCHEDULE",
];

const normalizeBookingStatus = (status) => String(status || "").toLowerCase();
const normalizeSubscriptionBookingStatus = (status) => String(status || "").toUpperCase();

const resolveObjectId = (value) => {
  if (!value) return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string") {
    return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
  }
  if (typeof value === "object") {
    return resolveObjectId(value._id || value.id || value.valueOf?.());
  }
  return value;
};

const buildBookingTitle = (subscription, sessionNumber) => {
  const packageName = subscription.package?.name || subscription.package?.title || "Subscription";
  return `${packageName} - Session ${sessionNumber}`;
};

class SubscriptionScheduleService {
  async rebuildSessions(subscription, { cycleIndex = 0, session = null } = {}) {
    const scheduleQuery = SubscriptionSchedule.findOne({
      subscription: subscription._id,
      cycleIndex,
    });
    if (session) scheduleQuery.session(session);
    const existingSchedule = await scheduleQuery;

    if (existingSchedule) {
      const bookingIds = (existingSchedule.sessions || []).map((item) => item.booking).filter(Boolean);
      const subscriptionBookingIds = (existingSchedule.sessions || []).map((item) => item.subscriptionBooking).filter(Boolean);

      if (bookingIds.length > 0) {
        const bookingDelete = Booking.deleteMany({ _id: { $in: bookingIds } });
        if (session) bookingDelete.session(session);
        await bookingDelete;
      }

      if (subscriptionBookingIds.length > 0) {
        const subBookingDelete = SubscriptionBooking.deleteMany({ _id: { $in: subscriptionBookingIds } });
        if (session) subBookingDelete.session(session);
        await subBookingDelete;
      }

      const deleteQuery = SubscriptionSchedule.deleteOne({ _id: existingSchedule._id });
      if (session) deleteQuery.session(session);
      await deleteQuery;
    }

    return await this.generateSessions(subscription, { cycleIndex, force: true, session });
  }

  async generateSessions(subscription, { cycleIndex = 0, force = false, session = null } = {}) {
    const cycle = buildCycleWindow(subscription.startDate, cycleIndex);
    const scheduleQuery = SubscriptionSchedule.findOne({
      subscription: subscription._id,
      cycleIndex,
    });
    if (session) scheduleQuery.session(session);
    const existingSchedule = await scheduleQuery;

    if (existingSchedule && !force) {
      return existingSchedule;
    }

    const photographerIdentity = await getPhotographerIdentity(
      resolveObjectId(subscription.photographer?.user?._id || subscription.photographer?.user || subscription.photographer?._id || subscription.photographer)
    );
    const preferredSchedule = sanitizePreferredSchedule(subscription.preferredSchedule, [
      { dayOfWeek: 5, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: 6, startTime: "13:00", endTime: "16:00" },
    ]);

    const candidateSlots = getCandidateDates(cycle.cycleStart, cycle.cycleEnd, preferredSchedule);
    const busyBookings = await getBookedRangesForPhotographer({
      photographerIds: photographerIdentity.ids,
      start: cycle.cycleStart,
      end: cycle.cycleEnd,
    });

    const schedule = existingSchedule || new SubscriptionSchedule({
      subscription: subscription._id,
      cycleIndex,
      cycleStart: cycle.cycleStart,
      cycleEnd: cycle.cycleEnd,
      status: SubscriptionStatus.ACTIVE,
      totalSessions: subscription.sessionsPerMonth,
      generatedSessions: 0,
      conflictSessions: 0,
      sessions: [],
    });

    if (!schedule.sessions) schedule.sessions = [];

    const desiredSessions = Number(subscription.sessionsPerMonth || 0);
    const alreadyGenerated = schedule.sessions.length;
    const startSessionNumber = alreadyGenerated + 1;
    const sessionsToCreate = Math.max(0, desiredSessions - alreadyGenerated);
    const usedCandidateIndexes = new Set(
      schedule.sessions
        .map((item) => item.scheduledStart && new Date(item.scheduledStart).getTime())
        .filter(Boolean)
    );

    for (let i = 0; i < sessionsToCreate; i += 1) {
      const sessionNumber = startSessionNumber + i;
      const nextCandidate = candidateSlots.find((slot) => !usedCandidateIndexes.has(new Date(slot.start).getTime()));

      let bookingPayload = {
        customer: resolveObjectId(subscription.customer?._id || subscription.customer),
        photographer: resolveObjectId(subscription.photographer?._id || subscription.photographer),
        title: buildBookingTitle(subscription, sessionNumber),
        start: nextCandidate?.start || cycle.cycleStart,
        end: nextCandidate?.end || dayjs(cycle.cycleStart).add(3, "hour").toDate(),
        location: subscription.bookingLocationPreference || subscription.package?.description || "",
        price: 0,
        durationHours: 3,
        totalPrice: Number(subscription.package?.monthlyPrice || 0),
        depositAmount: 0,
        commissionRate: 0,
        commissionAmount: 0,
        photographerPayout: 0,
        style: subscription.package?.name || "",
        packageName: subscription.package?.name || "",
        status: normalizeBookingStatus(BookingStatus.DRAFT),
        paymentStatus: "unpaid",
        subscription: subscription._id,
        notes: subscription.notes || "",
      };

      const isConflict = busyBookings.some((busy) =>
        rangesOverlap(
          bookingPayload.start,
          bookingPayload.end,
          busy.start,
          busy.end
        )
      );

      const suggestedSlots = isConflict ? makeSuggestedSlots(candidateSlots.filter((slot) => {
        return !busyBookings.some((busy) => rangesOverlap(slot.start, slot.end, busy.start, busy.end));
      })) : [];

      if (isConflict) {
        bookingPayload.status = normalizeBookingStatus(BookingStatus.NEED_RESCHEDULE);
      }

      const booking = await Booking.create([bookingPayload], session ? { session } : {}).then((items) => items[0]);

      const subscriptionBooking = await SubscriptionBooking.create(
        [{
          subscription: subscription._id,
          schedule: schedule._id,
          booking: booking._id,
          cycleIndex,
          sessionNumber,
          status: isConflict
            ? normalizeSubscriptionBookingStatus(BookingStatus.NEED_RESCHEDULE)
            : normalizeSubscriptionBookingStatus(BookingStatus.DRAFT),
          scheduledStart: bookingPayload.start,
          scheduledEnd: bookingPayload.end,
          conflictReason: isConflict ? "Conflicting booking exists in the selected time range" : "",
          rescheduleRequired: isConflict,
          suggestedSlots,
          isAutoGenerated: true,
        }],
        session ? { session } : {}
      ).then((items) => items[0]);

      booking.subscription = subscription._id;
      booking.subscriptionBooking = subscriptionBooking._id;
      await booking.save(session ? { session } : {});

      schedule.sessions.push({
        booking: booking._id,
        subscriptionBooking: subscriptionBooking._id,
        sessionNumber,
        scheduledStart: bookingPayload.start,
        scheduledEnd: bookingPayload.end,
        conflictReason: isConflict ? "Conflicting booking exists in the selected time range" : "",
        rescheduleRequired: isConflict,
        suggestedSlots,
        status: isConflict
          ? normalizeSubscriptionBookingStatus(BookingStatus.NEED_RESCHEDULE)
          : normalizeSubscriptionBookingStatus(BookingStatus.DRAFT),
      });

      if (isConflict) {
        schedule.conflictSessions += 1;
      } else {
        schedule.generatedSessions += 1;
      }
    }

    await schedule.save(session ? { session } : {});
    return schedule;
  }

  async markFutureBookings(subscriptionId, { status, reason = "", session = null }) {
    const futureBookingsQuery = Booking.find({
      subscription: subscriptionId,
      status: { $nin: ["COMPLETED", "completed", "CANCELLED", "cancelled"] },
    });
    if (session) futureBookingsQuery.session(session);
    const futureBookings = await futureBookingsQuery;

    for (const booking of futureBookings) {
      booking.status = status;
      if (reason) {
        booking.rejectReason = reason;
        booking.notes = [booking.notes, reason].filter(Boolean).join(" | ");
      }
      await booking.save(session ? { session } : {});
    }

    const updateQuery = SubscriptionBooking.updateMany(
      { subscription: subscriptionId, status: { $nin: ["COMPLETED", "CANCELLED"] } },
      {
        $set: {
          status,
          conflictReason: reason || undefined,
          rescheduleRequired: status === BookingStatus.NEED_RESCHEDULE || status === BookingStatus.RESCHEDULED,
        },
      }
    );
    if (session) updateQuery.session(session);
    await updateQuery;

    return futureBookings.length;
  }
}

module.exports = new SubscriptionScheduleService();
