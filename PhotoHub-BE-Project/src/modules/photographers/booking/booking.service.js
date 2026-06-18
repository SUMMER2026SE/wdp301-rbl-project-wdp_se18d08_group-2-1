const Booking = require("./booking.model");
const Photographer = require("../models/photographer");
const { ACTIVE_BOOKING_STATUSES, rangesOverlap } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

const APPROVAL_WINDOW_HOURS = 72;
const toLowerStatus = (status = "") => String(status).toLowerCase();

class BookingService {
  async findBookingById(id) {
    return await Booking.findById(id).populate("customer", "fullName email avatar");
  }

  async checkOverlap(photographerIds, start, end, excludeBookingId = null) {
    if (!start || !end) return false;

    const ids = Array.isArray(photographerIds) ? photographerIds : [photographerIds];
    const query = {
      photographer: { $in: ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      $or: [
        { start: { $lt: end, $gte: start } },
        { end: { $gt: start, $lte: end } },
        { start: { $lte: start }, end: { $gte: end } },
        { bookingDate: { $lt: end, $gte: start } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const overlapCount = await Booking.countDocuments(query);
    return overlapCount > 0;
  }

  async getBusyBookings(photographerIds, from, to, excludeBookingId = null) {
    if (!from || !to) return [];

    const ids = Array.isArray(photographerIds) ? photographerIds : [photographerIds];
    const query = {
      photographer: { $in: ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      $or: [
        { start: { $lt: to }, end: { $gt: from } },
        { bookingDate: { $lt: to, $gt: from } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query).select("start end bookingDate durationHours status title").sort({ start: 1 });
    return bookings.map((booking) => ({
      ...booking.toObject(),
      ...normalizeBookingTime(booking),
    }));
  }

  async suggestAlternativeSlots(photographerIds, preferredStart, preferredEnd, excludeBookingId = null) {
    if (!preferredStart || !preferredEnd) return [];

    const originalStart = new Date(preferredStart);
    const originalEnd = new Date(preferredEnd);
    const durationMs = Math.max(60 * 60 * 1000, originalEnd - originalStart);
    const searchStart = new Date(Math.max(Date.now(), originalStart.getTime()));
    const searchEnd = new Date(searchStart.getTime() + 21 * 24 * 60 * 60 * 1000);
    const busyBookings = await this.getBusyBookings(photographerIds, searchStart, searchEnd, excludeBookingId);

    const suggestions = [];
    const preferredHour = originalStart.getHours();

    for (let dayOffset = 0; dayOffset < 21 && suggestions.length < 6; dayOffset += 1) {
      const day = new Date(searchStart);
      day.setDate(searchStart.getDate() + dayOffset);

      const candidateHours = [preferredHour, 8, 10, 13, 15, 17]
        .filter((hour, index, arr) => hour >= 8 && hour <= 18 && arr.indexOf(hour) === index);

      for (const hour of candidateHours) {
        const candidateStart = new Date(day);
        candidateStart.setHours(hour, 0, 0, 0);
        const candidateEnd = new Date(candidateStart.getTime() + durationMs);

        if (candidateStart < new Date()) continue;
        if (candidateEnd.getHours() > 21 || candidateEnd.getDate() !== candidateStart.getDate()) continue;

        const conflicts = busyBookings.some((booking) =>
          rangesOverlap(candidateStart, candidateEnd, booking.start, booking.end)
        );

        if (!conflicts) {
          const dayDistancePenalty = Math.min(dayOffset * 4, 60);
          const hourDistancePenalty = Math.min(Math.abs(hour - preferredHour) * 3, 25);
          suggestions.push({
            start: candidateStart,
            end: candidateEnd,
            score: Math.max(10, 100 - dayDistancePenalty - hourDistancePenalty),
            reason:
              dayOffset === 0
                ? "Same-day free slot with no calendar conflict"
                : "Nearest free slot based on photographer availability",
          });
        }

        if (suggestions.length >= 6) break;
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  async acceptBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to accept this booking");
    }

    if (toLowerStatus(booking.status) !== "pending") {
      throw new Error("Only pending bookings can be accepted");
    }

    const bookingTime = normalizeBookingTime(booking);
    const hasConflict = await this.checkOverlap(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    if (hasConflict) {
      throw new Error("Schedule conflict detected");
    }

    booking.status = "accepted";
    booking.statusLogs = booking.statusLogs || [];
    booking.statusLogs.push({ status: "accepted", note: "Photographer accepted booking" });
    await booking.save();

    return booking;
  }

  async rejectBooking(bookingId, photographerUserId, rejectReason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to reject this booking");
    }

    if (["rejected", "cancelled", "disputed"].includes(toLowerStatus(booking.status))) {
      throw new Error("Booking is already rejected or cancelled");
    }

    const bookingTime = normalizeBookingTime(booking);
    const hasConflict = await this.checkOverlap(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    const alternativeSlots = await this.suggestAlternativeSlots(
      identity.ids,
      bookingTime.start,
      bookingTime.end,
      booking._id
    );

    booking.status = "rejected";
    booking.rejectReason = rejectReason || (hasConflict ? "Scheduling conflict" : "Photographer rejected");
    booking.suggestedSlots = alternativeSlots;
    await booking.save();

    return {
      booking,
      hasConflict,
      alternativeSlots,
      message: hasConflict
        ? "Booking rejected because of a scheduling conflict. Alternative slots were generated."
        : "Booking rejected. Alternative slots were generated for the customer.",
    };
  }

  async completeBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to complete this booking");
    }

    const status = toLowerStatus(booking.status);
    if (!["accepted", "confirmed", "deposit_paid", "in_progress"].includes(status)) {
      throw new Error("Booking can only be completed from accepted or confirmed state");
    }

    if (!booking.finalAlbum) {
      throw new Error("You must upload a final photo album before completing the booking");
    }

    const now = new Date();
    booking.status = "completed";
    booking.completionStatus = "photographer_completed";
    booking.completedAt = now;
    booking.submittedForApprovalAt = now;
    booking.autoCompleteAt = new Date(now.getTime() + APPROVAL_WINDOW_HOURS * 60 * 60 * 1000);
    booking.payoutEligibleAt = booking.autoCompleteAt;
    await booking.save();

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (photographer) {
      photographer.completedBookings = (photographer.completedBookings || 0) + 1;
      photographer.totalEarnings = (photographer.totalEarnings || 0) + (booking.price || booking.totalPrice || 0);
      await photographer.save();
    }

    return booking;
  }

  async approveCompletion(bookingId, customerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.customer.toString() !== customerUserId.toString()) {
      throw new Error("You are not authorized to approve this booking");
    }

    if (booking.completionStatus !== "photographer_completed") {
      throw new Error("Booking is not waiting for customer approval");
    }

    const now = new Date();
    booking.completionStatus = "customer_approved";
    booking.customerApprovedAt = now;
    booking.payoutEligibleAt = now;
    booking.paymentStatus = booking.paymentStatus === "unpaid" ? "paid" : booking.paymentStatus;
    await booking.save();

    return booking;
  }

  async autoCompleteEligibleBookings(photographerUserId = null) {
    const now = new Date();
    const query = {
      completionStatus: "photographer_completed",
      autoCompleteAt: { $lte: now },
    };

    if (photographerUserId) {
      const identity = await getPhotographerIdentity(photographerUserId);
      query.photographer = { $in: identity.ids };
    }

    const result = await Booking.updateMany(query, {
      $set: {
        completionStatus: "auto_completed",
        payoutEligibleAt: now,
      },
    });

    return result.modifiedCount || result.nModified || 0;
  }
}

module.exports = new BookingService();
