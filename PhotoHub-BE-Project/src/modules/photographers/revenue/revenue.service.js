const { Booking } = require("../../bookings/models/booking.model");
const WithdrawRequest = require("../withdraw/withdrawRequest.model");

class RevenueService {
  async getRevenueData(photographerUserId) {
    const completedBookings = await Booking.find({
      photographer: photographerUserId,
      status: "completed",
    });

    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const completedBookingsCount = completedBookings.length;

    const withdrawRequests = await WithdrawRequest.find({
      photographerId: photographerUserId,
    });

    const totalWithdrawn = withdrawRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const pendingWithdrawn = withdrawRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const withdrawableAmount = Math.max(0, totalRevenue - totalWithdrawn - pendingWithdrawn);

    const monthlyRevenueMap = {};
    completedBookings.forEach((b) => {
      const dateToUse = b.completedAt || b.createdAt;
      const month = dateToUse.toISOString().substring(0, 7);
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + (b.price || 0);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap)
      .sort()
      .map((month) => ({
        month,
        revenue: monthlyRevenueMap[month],
      }));

    return {
      totalRevenue,
      completedBookings: completedBookingsCount,
      totalWithdrawn,
      pendingWithdrawn,
      withdrawableAmount,
      monthlyRevenue,
    };
  }
}

module.exports = new RevenueService();
