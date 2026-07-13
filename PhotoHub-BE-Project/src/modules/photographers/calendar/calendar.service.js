const { Booking } = require("../../bookings/models/booking.model");
const { GroupBooking } = require("../../group_booking/models/groupBooking.model");
const { GroupMember } = require("../../group_booking/models/groupMember.model");
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

    // 1. Query Booking bình thường
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

    const bookingEvents = bookings.map((booking) => {
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
        isGroupBooking: false,
      };
    });

    // 2. Query GroupBooking đang chờ chốt (PENDING)
    const groupQuery = {
      photographer: { $in: identity.ids },
      status: "PENDING",
    };

    if (start && end) {
      groupQuery.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } },
      ];
    }

    const groupBookings = await GroupBooking.find(groupQuery)
      .populate("concept", "title locationType")
      .populate("leader", "fullName email avatar phoneNumber");

    const groupEvents = await Promise.all(
      groupBookings.map(async (gb) => {
        const totalCount = await GroupMember.countDocuments({ group: gb._id });
        const paidCount = await GroupMember.countDocuments({
          group: gb._id,
          paymentStatus: "PAID",
        });

        return {
          id: gb._id,
          title: `Nhóm chờ cọc [${gb.groupCode}]: ${gb.concept?.title || "Concept chụp chung"}`,
          start: gb.start,
          end: gb.end,
          location: gb.concept?.locationType || "Tại Studio",
          status: "group_pending",
          price: gb.currentPrice,
          customer: gb.leader,
          memberProgress: `${paidCount}/${gb.maxMembers} (Đăng ký: ${totalCount}/${gb.maxMembers})`,
          isGroupBooking: true,
          hasConflict: false,
          conflictWith: [],
        };
      })
    );

    // 3. Gộp cả 2 nguồn và sắp xếp
    return [...bookingEvents, ...groupEvents].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );
  }
}

module.exports = new CalendarService();
