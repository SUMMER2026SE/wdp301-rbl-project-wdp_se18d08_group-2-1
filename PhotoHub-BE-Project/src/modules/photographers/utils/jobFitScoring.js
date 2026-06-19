const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "accepted",
  "confirmed",
  "completed",
  "PENDING",
  "ACCEPTED",
  "DEPOSIT_PAID",
  "IN_PROGRESS",
  "COMPLETED",
];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const normalize = (value = "") => String(value).trim().toLowerCase();

const rangesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

const getSessionRange = (jobDate, durationHours = 3) => {
  const start = new Date(jobDate);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start, end };
};

const hasAvailabilityConflict = (job, busyBookings = []) => {
  const { start, end } = getSessionRange(job.date);
  return busyBookings.some((booking) => rangesOverlap(start, end, booking.start, booking.end));
};

const calculateFitScore = (job, photographer, busyBookings = []) => {
  const photographerStyles = (photographer.styles || []).map(normalize).filter(Boolean);
  const jobStyle = normalize(job.style);
  const photographerLocation = normalize(photographer.location);
  const jobLocation = normalize(job.location);
  const hourlyRate = Number(photographer.hourlyRate || 0);
  const expectedSessionPrice = hourlyRate > 0 ? hourlyRate * 3 : 0;
  const budget = Number(job.budget || 0);

  const styleMatched = photographerStyles.some(
    (style) => style === jobStyle || jobStyle.includes(style) || style.includes(jobStyle)
  );
  const locationMatched =
    photographerLocation &&
    jobLocation &&
    (photographerLocation.includes(jobLocation) || jobLocation.includes(photographerLocation));
  const conflict = hasAvailabilityConflict(job, busyBookings);

  const styleScore = styleMatched ? 30 : photographerStyles.length > 0 ? 8 : 15;
  const locationScore = locationMatched ? 20 : photographerLocation ? 6 : 12;
  const budgetScore =
    expectedSessionPrice <= 0 ? 15 : clamp(Math.round((budget / expectedSessionPrice) * 20), 0, 20);
  const availabilityScore = conflict ? 0 : 20;
  const ratingScore = clamp(Math.round(((photographer.averageRating || 0) / 5) * 6), 0, 6);
  const historyScore = clamp(Math.round(Math.min(photographer.completedBookings || 0, 20) / 20 * 4), 0, 4);

  const matchScore = clamp(
    Math.round(styleScore + locationScore + budgetScore + availabilityScore + ratingScore + historyScore)
  );

  const recommendedPrice =
    budget > 0 && expectedSessionPrice > 0
      ? Math.round(Math.min(budget, Math.max(expectedSessionPrice, budget * 0.85)))
      : Math.round(expectedSessionPrice || budget || 0);

  return {
    matchScore,
    fitScore: matchScore,
    recommendedPrice,
    recommendedEstimatedTime: "3-5 days after shooting",
    availability: {
      available: !conflict,
      reason: conflict ? "Photographer already has an overlapping booking" : "No booking conflict detected",
    },
    matchBreakdown: {
      style: {
        score: styleScore,
        matched: styleMatched,
        reason: styleMatched ? "Portfolio style matches the job style" : "Style is not an exact match",
      },
      location: {
        score: locationScore,
        matched: Boolean(locationMatched),
        reason: locationMatched ? "Photographer location matches the job area" : "Location is not an exact match",
      },
      budget: {
        score: budgetScore,
        expectedSessionPrice,
        reason:
          expectedSessionPrice <= 0
            ? "Photographer hourly rate is not configured"
            : "Budget compared with estimated session price",
      },
      availability: {
        score: availabilityScore,
        conflict,
        reason: conflict ? "Conflicting calendar slot" : "Calendar is free for this job date",
      },
      reputation: {
        score: ratingScore + historyScore,
        averageRating: photographer.averageRating || 0,
        completedBookings: photographer.completedBookings || 0,
      },
    },
  };
};

module.exports = {
  ACTIVE_BOOKING_STATUSES,
  calculateFitScore,
  rangesOverlap,
  getSessionRange,
};
