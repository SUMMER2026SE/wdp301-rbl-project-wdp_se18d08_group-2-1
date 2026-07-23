const { Booking } = require("../../bookings/models/booking.model");
const SubscriptionPayment = require("../../subscriptions/models/subscriptionPayment.model");
const WithdrawRequest = require("../withdraw/withdrawRequest.model");
const Bid = require("../bid/bid.model");
const Payment = require("../../admin/models/Payment");
const Dispute = require("../../admin/models/Dispute");
const Wallet = require("../../admin/models/Wallet");
const { getPhotographerIdentity } = require("../utils/photographerIdentity");

const COMMISSION_RATE = Number(process.env.PHOTOGRAPHER_COMMISSION_RATE || 0.1);
const COMPLETED_STATUSES = ["completed", "COMPLETED"];
const TERMINAL_CANCELLED_STATUSES = ["rejected", "cancelled", "CANCELLED", "DISPUTED"];
const WITHDRAW_PAID_STATUSES = ["paid", "PAID"];
const WITHDRAW_RESERVED_STATUSES = ["pending", "PENDING", "approved", "APPROVED"];
const OPEN_DISPUTE_STATUSES = ["OPEN", "INVESTIGATING"];

const isCompletedBooking = (booking) =>
  COMPLETED_STATUSES.includes(booking.status) ||
  ["customer_approved", "auto_completed"].includes(booking.completionStatus);

const monthKey = (date) => new Date(date).toISOString().substring(0, 7);

const incrementMap = (map, key, amount = 1) => {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
};

const getBookingAmount = (booking) => Number(booking.price || booking.totalPrice || 0);

function buildDateRange(query = {}) {
  let startDate = null;
  let endDate = null;

  // Theo khoảng ngày
  if (query.startDate && query.endDate) {
    startDate = new Date(query.startDate);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  // Theo khoảng tháng
  if (query.startMonth && query.endMonth) {
    const [sy, sm] = query.startMonth.split("-").map(Number);
    const [ey, em] = query.endMonth.split("-").map(Number);

    startDate = new Date(sy, sm - 1, 1);

    endDate = new Date(ey, em, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  // Theo khoảng năm
  if (query.startYear && query.endYear) {
    startDate = new Date(Number(query.startYear), 0, 1);

    endDate = new Date(Number(query.endYear), 11, 31);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  // Theo khoảng quý
  if (query.startQuarter && query.endQuarter) {
    const parseQuarter = (value) => {
      const match = value.match(/^(\d{4})-Q?([1-4])$/i);

      if (!match) return null;

      return {
        year: Number(match[1]),
        quarter: Number(match[2]),
      };
    };

    const start = parseQuarter(query.startQuarter);
    const end = parseQuarter(query.endQuarter);

    if (start && end) {
      startDate = new Date(start.year, (start.quarter - 1) * 3, 1);

      endDate = new Date(end.year, end.quarter * 3, 0);
      endDate.setHours(23, 59, 59, 999);

      return { startDate, endDate };
    }
  }

  return { startDate: null, endDate: null };
}

class RevenueService {
  async getPaidBookingIds(bookings) {
    const bookingIds = bookings.map((booking) => booking._id);
    const payments = await Payment.find({
      booking: { $in: bookingIds },
      status: "SUCCESS",
      paymentType: { $in: ["DEPOSIT", "FINAL"] },
    }).select("booking amount");

    const paidMap = new Map();
    payments.forEach((payment) => {
      const key = String(payment.booking);
      paidMap.set(key, (paidMap.get(key) || 0) + (payment.amount || 0));
    });

    return new Set(
      bookings
        .filter((booking) => {
          if (booking.paymentStatus === "paid") return true;
          const paidAmount = paidMap.get(String(booking._id)) || 0;
          const bookingAmount = getBookingAmount(booking);
          return bookingAmount > 0 ? paidAmount >= bookingAmount : paidAmount > 0;
        })
        .map((booking) => String(booking._id))
    );
  }

  async getOpenDisputeBookingIds(bookings) {
    const disputes = await Dispute.find({
      booking: { $in: bookings.map((booking) => booking._id) },
      status: { $in: OPEN_DISPUTE_STATUSES },
    }).select("booking status");

    return new Set(disputes.map((dispute) => String(dispute.booking)));
  }

  async getRevenueData(photographerUserId, query = {}) {
    const identity = await getPhotographerIdentity(photographerUserId);

    const { startDate, endDate } = buildDateRange(query);

    const allBookings = await Booking.find({
      photographer: { $in: identity.ids },
    }).sort({ createdAt: -1 });

    const filteredBookings =
      startDate && endDate
        ? allBookings.filter((booking) => {
          const date = booking.completedAt || booking.createdAt;
          return date >= startDate && date <= endDate;
        })
        : allBookings;

    const completedBookings = filteredBookings.filter(isCompletedBooking);
    const now = new Date();
    const withdrawQuery = identity.photographerId
      ? { $or: [{ photographerId: photographerUserId }, { photographer: identity.photographerId }] }
      : { photographerId: photographerUserId };
    const [
      paidBookingIds,
      openDisputeBookingIds,
      withdrawRequests,
      bids,
      successfulSubscriptionPayments,
    ] = await Promise.all([
      this.getPaidBookingIds(allBookings),
      this.getOpenDisputeBookingIds(completedBookings),
      WithdrawRequest.find(withdrawQuery),
      Bid.find({ photographerId: { $in: identity.ids } })
        .select("status price createdAt"),

      SubscriptionPayment.find({
        photographer: { $in: identity.ids },
        status: "SUCCESS",
      }).sort({ createdAt: -1 }),
    ]);
    const filteredBids =
      startDate && endDate
        ? bids.filter(
          (bid) =>
            bid.createdAt >= startDate &&
            bid.createdAt <= endDate
        )
        : bids;

    const filteredSubscriptions =
      startDate && endDate
        ? successfulSubscriptionPayments.filter(
          (payment) =>
            payment.createdAt >= startDate &&
            payment.createdAt <= endDate
        )
        : successfulSubscriptionPayments;

    const totalRevenue = completedBookings.reduce((sum, b) => sum + getBookingAmount(b), 0);
    const totalSubscriptionRevenue = filteredSubscriptions.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalGrossRevenue = totalRevenue + totalSubscriptionRevenue;
    const completedBookingsCount = completedBookings.length;

    const totalWithdrawn = withdrawRequests
      .filter((r) => WITHDRAW_PAID_STATUSES.includes(r.status))
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const pendingWithdrawn = withdrawRequests
      .filter((r) => WITHDRAW_RESERVED_STATUSES.includes(r.status))
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const eligibleBookings = completedBookings.filter((booking) => {
      const bookingId = String(booking._id);
      const payoutDate = booking.payoutEligibleAt ? new Date(booking.payoutEligibleAt) : booking.completedAt;
      return (
        paidBookingIds.has(bookingId) &&
        !openDisputeBookingIds.has(bookingId) &&
        payoutDate &&
        payoutDate <= now
      );
    });

    const blockedBookings = completedBookings
      .filter((booking) => !eligibleBookings.some((eligible) => String(eligible._id) === String(booking._id)))
      .map((booking) => ({
        id: booking._id,
        title: booking.title,
        price: getBookingAmount(booking),
        reason: openDisputeBookingIds.has(String(booking._id))
          ? "Open dispute"
          : !paidBookingIds.has(String(booking._id))
            ? "Waiting for full payment"
            : "Waiting for customer approval or auto-complete window",
      }));

    const eligibleBookingIdSet = new Set(eligibleBookings.map((booking) => String(booking._id)));
    const paidBlockedBookings = allBookings.filter((booking) => {
      const bookingId = String(booking._id);
      return (
        paidBookingIds.has(bookingId) &&
        !eligibleBookingIdSet.has(bookingId) &&
        !TERMINAL_CANCELLED_STATUSES.includes(booking.status) &&
        booking.paymentStatus !== "refunded"
      );
    });

    const eligibleRevenue = eligibleBookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0) + totalSubscriptionRevenue;
    const escrowAmount = Math.max(
      0,
      paidBlockedBookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0) + pendingWithdrawn
    );
    const withdrawableAmount = Math.max(0, eligibleRevenue - totalWithdrawn - pendingWithdrawn);
    const estimatedCommission = Math.round(withdrawableAmount * COMMISSION_RATE * 100) / 100;
    const netWithdrawableAmount = Math.max(0, withdrawableAmount - estimatedCommission);

    const wallet = await Wallet.findOneAndUpdate(
      { user: photographerUserId },
      {
        $set: {
          balance: withdrawableAmount,
          holdBalance: escrowAmount,
          currency: "VND",
        },
        $setOnInsert: {
          user: photographerUserId,
        },
      },
      { new: true, upsert: true }
    );

    const monthlyRevenueMap = {};
    const monthlyJobsMap = {};
    const styleRevenueMap = {};
    const packageRevenueMap = {};
    completedBookings.forEach((b) => {
      const dateToUse = b.completedAt || b.createdAt;
      const month = monthKey(dateToUse);
      const bookingAmount = getBookingAmount(b);
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + bookingAmount;
      monthlyJobsMap[month] = (monthlyJobsMap[month] || 0) + 1;
      incrementMap(styleRevenueMap, b.style || "Uncategorized", bookingAmount);
      incrementMap(packageRevenueMap, b.packageName || "Standard", bookingAmount);
    });

    filteredSubscriptions.forEach((payment) => {
      const month = monthKey(payment.createdAt || new Date());
      const amount = Number(payment.amount || 0);
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + amount;
      const packageName = payment.metadata?.packageName || payment.metadata?.packageTitle || payment.metadata?.subscriptionName || "Monthly plan";
      incrementMap(packageRevenueMap, packageName, amount);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap)
      .sort()
      .map((month) => ({
        month,
        revenue: monthlyRevenueMap[month],
      }));

    const monthlyJobs = Object.keys(monthlyJobsMap)
      .sort()
      .map((month) => ({ month, jobs: monthlyJobsMap[month] }));

    const mapToRanking = (map) =>
      Object.entries(map)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    const acceptedBids = filteredBids.filter((bid) => bid.status === "accepted").length;
    const bidWinRate = filteredBids.length ? Math.round((acceptedBids / filteredBids.length) * 100) : 0;
    const activeOrFinishedBookings = filteredBookings.filter((booking) => !TERMINAL_CANCELLED_STATUSES.includes(booking.status));
    const completionRate = activeOrFinishedBookings.length
      ? Math.round((completedBookingsCount / activeOrFinishedBookings.length) * 100)
      : 0;

    return {
      filter: {
        startDate,
        endDate,
      },
      totalRevenue,
      subscriptionRevenue: totalSubscriptionRevenue,
      grossRevenue: totalGrossRevenue,
      completedBookings: completedBookingsCount,
      totalBookings: filteredBookings.length,
      totalWithdrawn,
      pendingWithdrawn,
      pendingPayout: withdrawableAmount,
      withdrawableAmount,
      netWithdrawableAmount,
      escrowAmount,
      commissionRate: COMMISSION_RATE,
      estimatedCommission,
      wallet,
      eligibleBookingIds: eligibleBookings.map((booking) => booking._id),
      eligibleBookings: eligibleBookings.map((booking) => ({
        id: booking._id,
        title: booking.title,
        price: getBookingAmount(booking),
        completedAt: booking.completedAt,
        payoutEligibleAt: booking.payoutEligibleAt,
      })),
      blockedBookings,
      monthlyRevenue,
      monthlyJobs,
      bidWinRate,
      acceptedBids,
      totalBids: bids.length,
      completionRate,
      topStyles: mapToRanking(styleRevenueMap),
      topPackages: mapToRanking(packageRevenueMap),
    };
  }
}

module.exports = new RevenueService();
