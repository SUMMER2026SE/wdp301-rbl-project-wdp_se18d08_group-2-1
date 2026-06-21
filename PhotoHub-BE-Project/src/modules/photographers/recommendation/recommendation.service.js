const JobPost = require("../job/jobPost.model");
const { Booking } = require("../../bookings/models/booking.model");
const Photographer = require("../models/photographer");
const { ACTIVE_BOOKING_STATUSES, calculateFitScore } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

class RecommendationService {
  async recommendJobsForPhotographer(photographerUserId) {
    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) {
      throw new Error("Photographer profile not found");
    }

    const openJobs = await JobPost.find({ status: "open" }).populate("customer", "fullName email avatar");

    const identity = await getPhotographerIdentity(photographerUserId);
    const busyBookings = await Booking.find({
      photographer: { $in: identity.ids },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select("start end bookingDate durationHours status title");
    const normalizedBusyBookings = busyBookings.map((booking) => ({
      ...booking.toObject(),
      ...normalizeBookingTime(booking),
    }));

    const recommendedJobs = openJobs.map((job) => {
      const jobObj = job.toObject();
      return {
        ...jobObj,
        ...calculateFitScore(jobObj, photographer, normalizedBusyBookings),
      };
    });

    recommendedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return recommendedJobs;
  }
}

module.exports = new RecommendationService();
