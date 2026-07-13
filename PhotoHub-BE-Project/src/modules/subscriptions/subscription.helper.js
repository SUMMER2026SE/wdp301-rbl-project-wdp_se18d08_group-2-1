const dayjs = require("dayjs");
const { rangesOverlap } = require("../photographers/utils/jobFitScoring");
const { Booking } = require("../bookings/models/booking.model");

const DEFAULT_TIMEZONE = process.env.SUBSCRIPTION_TIMEZONE || "Asia/Ho_Chi_Minh";

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date, months) => dayjs(date).add(Number(months || 0), "month").toDate();
const startOfDay = (date) => dayjs(date).startOf("day").toDate();
const endOfDay = (date) => dayjs(date).endOf("day").toDate();

const buildCycleWindow = (startDate, cycleIndex = 0) => {
  const cycleStart = addMonths(startDate, cycleIndex);
  const cycleEnd = dayjs(addMonths(startDate, cycleIndex + 1)).subtract(1, "millisecond").toDate();
  return { cycleStart, cycleEnd };
};

const buildPauseEnd = (pausedAt, pauseDays = 30) => dayjs(pausedAt).add(Number(pauseDays || 30), "day").toDate();

const getMonthEnd = (date) => dayjs(date).endOf("month").toDate();

const getMonthStart = (date) => dayjs(date).startOf("month").toDate();

const sanitizePreferredSchedule = (preferredSchedule = [], fallback = []) => {
  const raw = Array.isArray(preferredSchedule) && preferredSchedule.length > 0 ? preferredSchedule : fallback;
  return raw
    .map((item) => ({
      dayOfWeek: Number(item.dayOfWeek ?? item.weekday ?? item.day ?? 5),
      startTime: String(item.startTime || item.timeStart || "09:00"),
      endTime: String(item.endTime || item.timeEnd || "12:00"),
      location: String(item.location || item.locationPreference || ""),
      note: String(item.note || ""),
    }))
    .filter((item) => Number.isInteger(item.dayOfWeek) && item.dayOfWeek >= 0 && item.dayOfWeek <= 6);
};

const getTimeRangeFromSlot = (slotDate, slot) => {
  const [startHour, startMinute = 0] = String(slot.startTime || "09:00").split(":").map(Number);
  const [endHour, endMinute = 0] = String(slot.endTime || "12:00").split(":").map(Number);
  const start = dayjs(slotDate).hour(startHour || 0).minute(startMinute || 0).second(0).millisecond(0).toDate();
  const end = dayjs(slotDate).hour(endHour || 0).minute(endMinute || 0).second(0).millisecond(0).toDate();
  return { start, end: end <= start ? dayjs(start).add(3, "hour").toDate() : end };
};

const getCandidateDates = (cycleStart, cycleEnd, preferredSchedule = []) => {
  const days = [];
  const cursor = dayjs(cycleStart).startOf("day");
  const end = dayjs(cycleEnd).endOf("day");
  const slots = preferredSchedule.length > 0 ? preferredSchedule : [{ dayOfWeek: 5, startTime: "09:00", endTime: "12:00" }];

  let current = cursor;
  while (current.isBefore(end) || current.isSame(end)) {
    slots.forEach((slot) => {
      if (current.day() === slot.dayOfWeek) {
        const range = getTimeRangeFromSlot(current.toDate(), slot);
        if (range.start > new Date()) {
          days.push({
            start: range.start,
            end: range.end,
            slot,
          });
        }
      }
    });
    current = current.add(1, "day");
  }
  return days.sort((a, b) => new Date(a.start) - new Date(b.start));
};

const makeSuggestedSlots = (candidateDates, limit = 3) =>
  candidateDates.slice(0, limit).map((slot, index) => ({
    start: slot.start,
    end: slot.end,
    score: 100 - index * 10,
    reason: slot.slot?.note || "Suggested available slot",
  }));

const getActiveBookingStatuses = () => [
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

const getBookedRangesForPhotographer = async ({ photographerIds = [], start, end, excludeBookingIds = [] }) => {
  if (!photographerIds.length) return [];
  return await Booking.find({
    photographer: { $in: photographerIds },
    _id: { $nin: excludeBookingIds },
    status: { $in: getActiveBookingStatuses() },
    $or: [{ start: { $lt: end }, end: { $gt: start } }],
  }).select("_id start end status photographer title customer");
};

const countSessionsByStatus = async ({ subscriptionId, cycleStart, cycleEnd }) => {
  const BookingSubscription = require("./models/subscriptionBooking.model");
  const bookings = await BookingSubscription.find({
    subscription: subscriptionId,
    scheduledStart: { $gte: cycleStart, $lte: cycleEnd },
  }).select("status");

  const counts = bookings.reduce(
    (acc, item) => {
      const status = String(item.status || "").toUpperCase();
      if (status === "COMPLETED") acc.completedSessions += 1;
      else if (status === "CONFIRMED") acc.confirmedUpcomingSessions += 1;
      else if (status === "DRAFT") acc.draftSessions += 1;
      else if (status === "NEED_RESCHEDULE") acc.needRescheduleSessions += 1;
      return acc;
    },
    { completedSessions: 0, confirmedUpcomingSessions: 0, draftSessions: 0, needRescheduleSessions: 0 }
  );

  return {
    totalSessions: bookings.length,
    ...counts,
    remainingSessions: Math.max(0, bookings.length ? 0 : 0),
  };
};

const calculateRemainingSessions = async ({ subscription, cycleStart, cycleEnd }) => {
  const BookingSubscription = require("./models/subscriptionBooking.model");
  const bookings = await BookingSubscription.find({
    subscription: subscription._id,
    scheduledStart: { $gte: cycleStart, $lte: cycleEnd },
  }).select("status");

  const summary = bookings.reduce(
    (acc, item) => {
      const status = String(item.status || "").toUpperCase();
      if (status === "COMPLETED") acc.completedSessions += 1;
      else if (status === "CONFIRMED") acc.confirmedUpcomingSessions += 1;
      else if (status === "DRAFT") acc.draftSessions += 1;
      else if (status === "NEED_RESCHEDULE") acc.needRescheduleSessions += 1;
      return acc;
    },
    {
      totalSessions: subscription.sessionsPerMonth || 0,
      completedSessions: 0,
      confirmedUpcomingSessions: 0,
      draftSessions: 0,
      needRescheduleSessions: 0,
    }
  );

  summary.remainingSessions = Math.max(
    0,
    Number(subscription.sessionsPerMonth || 0) - summary.completedSessions - summary.confirmedUpcomingSessions
  );
  summary.nextResetDate = cycleEnd;
  return summary;
};

const defaultPackages = () => [
  {
    code: "SUB-WEDDING",
    slug: "wedding-monthly",
    name: "Wedding Monthly",
    description: "Monthly wedding coverage with recurring session planning.",
    billingType: "MONTHLY",
    monthlyPrice: 2500000,
    sessionsPerMonth: 2,
    commitmentMonths: 3,
    maxPauseDays: 30,
    autoRenewDefault: true,
    features: ["Priority scheduling", "Draft booking automation", "Pause and resume support"],
    sortOrder: 1,
  },
  {
    code: "SUB-PORTRAIT",
    slug: "portrait-monthly",
    name: "Portrait Monthly",
    description: "Regular portrait sessions for personal and brand content.",
    billingType: "MONTHLY",
    monthlyPrice: 1800000,
    sessionsPerMonth: 4,
    commitmentMonths: 1,
    maxPauseDays: 15,
    autoRenewDefault: true,
    features: ["Flexible monthly slots", "Resume anytime", "Auto renewal"],
    sortOrder: 2,
  },
  {
    code: "SUB-EVENT",
    slug: "event-monthly",
    name: "Event Monthly",
    description: "Recurring event photography bundle with strong scheduling support.",
    billingType: "MONTHLY",
    monthlyPrice: 3200000,
    sessionsPerMonth: 3,
    commitmentMonths: 6,
    maxPauseDays: 45,
    autoRenewDefault: false,
    features: ["Reschedule suggestions", "Penalty protection", "Billing history"],
    sortOrder: 3,
  },
];

module.exports = {
  DEFAULT_TIMEZONE,
  normalizeDate,
  addMonths,
  startOfDay,
  endOfDay,
  buildCycleWindow,
  buildPauseEnd,
  getMonthEnd,
  getMonthStart,
  sanitizePreferredSchedule,
  getTimeRangeFromSlot,
  getCandidateDates,
  makeSuggestedSlots,
  getBookedRangesForPhotographer,
  calculateRemainingSessions,
  defaultPackages,
  rangesOverlap,
};
