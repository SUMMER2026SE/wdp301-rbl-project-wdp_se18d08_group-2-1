const Photographer = require("../models/photographer");

const getPhotographerIdentity = async (photographerUserId) => {
  const photographer = await Photographer.findOne({ user: photographerUserId }).select("_id user");
  const ids = [String(photographerUserId)];

  if (photographer?._id) {
    ids.push(String(photographer._id));
  }

  return {
    userId: String(photographerUserId),
    photographerId: photographer?._id ? String(photographer._id) : null,
    photographer,
    ids,
  };
};

const normalizeBookingTime = (booking) => {
  const start = booking.start || booking.bookingDate;
  const durationHours = Number(booking.durationHours || 2);
  const end =
    booking.end ||
    (start ? new Date(new Date(start).getTime() + durationHours * 60 * 60 * 1000) : null);

  return { start, end };
};

module.exports = {
  getPhotographerIdentity,
  normalizeBookingTime,
};
