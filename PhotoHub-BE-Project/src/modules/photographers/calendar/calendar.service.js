const Booking = require("../booking/booking.model");

class CalendarService {
  async getCalendarEvents(photographerUserId, queryParams = {}) {
    const { start, end } = queryParams;

    const query = {
      photographer: photographerUserId,
      status: { $in: ["accepted", "confirmed", "completed"] },
    };

    if (start && end) {
      query.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } },
      ];
    }

    const bookings = await Booking.find(query)
      .populate("customer", "fullName email avatar phoneNumber")
      .sort({ start: 1 });

    return bookings.map((booking) => ({
      id: booking._id,
      title: booking.title || `Session with ${booking.customer ? booking.customer.fullName : "Customer"}`,
      start: booking.start,
      end: booking.end,
      location: booking.location,
      status: booking.status,
      price: booking.price,
      customer: booking.customer,
    }));
  }
}

module.exports = new CalendarService();
