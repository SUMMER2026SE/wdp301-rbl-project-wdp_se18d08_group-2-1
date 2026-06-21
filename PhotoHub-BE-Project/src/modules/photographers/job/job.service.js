const JobPost = require("./jobPost.model");
const { Booking } = require("../../bookings/models/booking.model");
const Photographer = require("../models/photographer");
const { ACTIVE_BOOKING_STATUSES, calculateFitScore, getSessionRange } = require("../utils/jobFitScoring");
const { getPhotographerIdentity, normalizeBookingTime } = require("../utils/photographerIdentity");

class JobService {
  async listOpenJobs(filters = {}, photographerUserId = null) {
    const { location, budget, style, date, minScore } = filters;

    const query = { status: "open" };

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (budget) {
      query.budget = { $gte: Number(budget) };
    }

    if (style) {
      query.style = { $regex: style, $options: "i" };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const jobs = await JobPost.find(query)
      .populate("customer", "fullName email avatar phoneNumber")
      .sort({ createdAt: -1 });

    if (!photographerUserId) {
      return jobs;
    }

    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) {
      return jobs;
    }
    const identity = await getPhotographerIdentity(photographerUserId);

    const earliestJobDate = jobs.reduce((earliest, job) => {
      const dateValue = new Date(job.date);
      return !earliest || dateValue < earliest ? dateValue : earliest;
    }, null);

    const latestJobDate = jobs.reduce((latest, job) => {
      const dateValue = new Date(job.date);
      return !latest || dateValue > latest ? dateValue : latest;
    }, null);

    const busyBookings =
      earliestJobDate && latestJobDate
        ? await Booking.find({
            photographer: { $in: identity.ids },
            status: { $in: ACTIVE_BOOKING_STATUSES },
            $or: [
              {
                start: { $lt: new Date(latestJobDate.getTime() + 24 * 60 * 60 * 1000) },
                end: { $gt: new Date(earliestJobDate.getTime() - 24 * 60 * 60 * 1000) },
              },
              {
                bookingDate: {
                  $lt: new Date(latestJobDate.getTime() + 24 * 60 * 60 * 1000),
                  $gt: new Date(earliestJobDate.getTime() - 24 * 60 * 60 * 1000),
                },
              },
            ],
          }).select("start end bookingDate durationHours status title")
        : [];
    const normalizedBusyBookings = busyBookings.map((booking) => ({
      ...booking.toObject(),
      ...normalizeBookingTime(booking),
    }));

    const enrichedJobs = jobs.map((job) => {
      const jobObject = job.toObject();
      const sessionRange = getSessionRange(job.date);
      return {
        ...jobObject,
        sessionStart: sessionRange.start,
        sessionEnd: sessionRange.end,
        ...calculateFitScore(jobObject, photographer, normalizedBusyBookings),
      };
    });

    return enrichedJobs
      .filter((job) => (minScore ? job.matchScore >= Number(minScore) : true))
      .sort((a, b) => b.matchScore - a.matchScore || new Date(a.date) - new Date(b.date));
  }

  async getJobById(id) {
    const job = await JobPost.findById(id).populate("customer", "fullName email avatar phoneNumber");
    if (!job) {
      throw new Error("Job post not found");
    }
    return job;
  }
}

module.exports = new JobService();
