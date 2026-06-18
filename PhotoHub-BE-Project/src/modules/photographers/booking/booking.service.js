const Booking = require("./booking.model");
const Photographer = require("../models/photographer");

class BookingService {
  async findBookingById(id) {
    return await Booking.findById(id).populate("customer", "fullName email avatar");
  }

  async checkOverlap(photographerId, start, end, excludeBookingId = null) {
    const query = {
      photographer: photographerId,
      status: { $in: ["accepted", "confirmed", "completed"] },
      $or: [
        { start: { $lt: end, $gte: start } },
        { end: { $gt: start, $lte: end } },
        { start: { $lte: start }, end: { $gte: end } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const overlapCount = await Booking.countDocuments(query);
    return overlapCount > 0;
  }

  async acceptBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("You are not authorized to accept this booking");
    }

    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be accepted");
    }

    const hasConflict = await this.checkOverlap(
      booking.photographer,
      booking.start,
      booking.end,
      booking._id
    );

    if (hasConflict) {
      throw new Error("Schedule conflict detected");
    }

    booking.status = "accepted";
    await booking.save();

    return booking;
  }

  async rejectBooking(bookingId, photographerUserId, rejectReason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("You are not authorized to reject this booking");
    }

    if (["rejected", "cancelled"].includes(booking.status)) {
      throw new Error("Booking is already rejected or cancelled");
    }

    const hasConflict = await this.checkOverlap(
      booking.photographer,
      booking.start,
      booking.end,
      booking._id
    );

    booking.status = "rejected";
    booking.rejectReason = rejectReason || (hasConflict ? "Scheduling conflict" : "Photographer rejected");
    await booking.save();

    return {
      booking,
      hasConflict,
      message: hasConflict ? "Booking rejected. Note: This booking had a scheduling conflict." : "Booking rejected."
    };
  }

  async completeBooking(bookingId, photographerUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.photographer.toString() !== photographerUserId.toString()) {
      throw new Error("You are not authorized to complete this booking");
    }

    if (booking.status !== "accepted" && booking.status !== "confirmed") {
      throw new Error("Booking can only be completed from accepted or confirmed state");
    }

    if (!booking.finalAlbum) {
      throw new Error("You must upload a final photo album before completing the booking");
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (photographer) {
      photographer.completedBookings = (photographer.completedBookings || 0) + 1;
      photographer.totalEarnings = (photographer.totalEarnings || 0) + booking.price;
      await photographer.save();
    }

    return booking;
  }
}

module.exports = new BookingService();
