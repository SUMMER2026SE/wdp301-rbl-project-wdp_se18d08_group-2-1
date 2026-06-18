const { Booking } = require("../../bookings/models/booking.model");
const { ACTIVE_BOOKING_STATUSES, rangesOverlap } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

const getDefaultDeliveryDeadline = (booking) => {
  const base = booking.end || booking.start || booking.createdAt;
  if (!base) return null;
  return new Date(new Date(base).getTime() + 7 * 24 * 60 * 60 * 1000);
};

class CalendarService {
  async getCalendarEvents(photographerUserId, queryParams = {}) {
    const { start, end, status } = queryParams;
    const identity = await getPhotographerIdentity(photographerUserId);

    const query = {
      photographer: { $in: identity.ids },
      status: status ? status : { $in: ACTIVE_BOOKING_STATUSES },
    };

    if (start && end) {
      query.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } },
        { bookingDate: { $gte: new Date(start), $lte: new Date(end) } },
      ];
    }

    const bookings = await Booking.find(query)
      .populate("customer", "fullName email avatar phoneNumber")
      .sort({ start: 1 });

    return bookings.map((booking) => {
      const bookingTime = normalizeBookingTime(booking);
      const conflictingBookings = bookings.filter(
        (other) => {
          const otherTime = normalizeBookingTime(other);
          return (
            other._id.toString() !== booking._id.toString() &&
            rangesOverlap(bookingTime.start, bookingTime.end, otherTime.start, otherTime.end)
          );
        }
      );
      const deliveryDeadline = booking.deliveryDeadline || getDefaultDeliveryDeadline(booking);

      return {
        id: booking._id,
        title: booking.title || `Session with ${booking.customer ? booking.customer.fullName : "Customer"}`,
        start: bookingTime.start,
        end: bookingTime.end,
        location: booking.location,
        status: booking.status,
        price: booking.price || booking.totalPrice || 0,
        customer: booking.customer,
        style: booking.style,
        packageName: booking.packageName,
        finalAlbum: booking.finalAlbum,
        completionStatus: booking.completionStatus,
        deliveryDeadline,
        isDeliveryOverdue:
          deliveryDeadline && !["completed", "COMPLETED"].includes(String(booking.status))
            ? new Date(deliveryDeadline) < new Date()
            : false,
        hasConflict: conflictingBookings.length > 0,
        conflictWith: conflictingBookings.map((item) => ({
          id: item._id,
          title: item.title,
          start: normalizeBookingTime(item).start,
          end: normalizeBookingTime(item).end,
          status: item.status,
        })),
      };
    });
  }
}

module.exports = new CalendarService();
