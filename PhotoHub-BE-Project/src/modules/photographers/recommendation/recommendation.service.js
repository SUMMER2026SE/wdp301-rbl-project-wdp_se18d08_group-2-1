const JobPost = require("../job/jobPost.model");
const Photographer = require("../models/photographer");

class RecommendationService {
  async recommendJobsForPhotographer(photographerUserId) {
    const photographer = await Photographer.findOne({ user: photographerUserId });
    if (!photographer) {
      throw new Error("Photographer profile not found");
    }

    const openJobs = await JobPost.find({ status: "open" }).populate("customer", "fullName email avatar");

    const recommendedJobs = openJobs.map((job) => {
      let styleScore = 0;
      let locationScore = 0;
      let budgetScore = 0;
      let ratingScore = (photographer.averageRating || 0) / 5 * 10;

      const pStyles = photographer.styles || [];
      const jobStyle = job.style ? job.style.toLowerCase().trim() : "";
      const hasStyleMatch = pStyles.some(
        (s) => s.toLowerCase().trim() === jobStyle || jobStyle.includes(s.toLowerCase().trim())
      );
      if (hasStyleMatch) {
        styleScore = 40;
      }

      const pLocation = photographer.location ? photographer.location.toLowerCase().trim() : "";
      const jobLocation = job.location ? job.location.toLowerCase().trim() : "";
      if (pLocation && jobLocation && (pLocation.includes(jobLocation) || jobLocation.includes(pLocation))) {
        locationScore = 30;
      }

      const pRate = photographer.hourlyRate || 0;
      const expectedSessionPrice = pRate * 3;
      if (expectedSessionPrice <= 0) {
        budgetScore = 20;
      } else {
        const ratio = job.budget / expectedSessionPrice;
        if (ratio >= 1) {
          budgetScore = 20;
        } else {
          budgetScore = Math.max(0, ratio * 20);
        }
      }

      const matchScore = Math.round(styleScore + locationScore + budgetScore + ratingScore);

      const jobObj = job.toObject();
      jobObj.matchScore = matchScore;

      return jobObj;
    });

    recommendedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return recommendedJobs;
  }
}

module.exports = new RecommendationService();
