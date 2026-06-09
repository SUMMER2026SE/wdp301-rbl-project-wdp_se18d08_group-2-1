const jobService = require("./job.service");
const ApiResponse = require("../../../utils/ApiResponse");

class JobController {
  async getJobPosts(req, res) {
    try {
      const jobs = await jobService.listOpenJobs(req.query);
      return ApiResponse.success(res, jobs, "Marketplace jobs retrieved successfully");
    } catch (error) {
      console.error("Error retrieving job posts:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getJobDetail(req, res) {
    try {
      const { id } = req.params;
      const job = await jobService.getJobById(id);
      return ApiResponse.success(res, job, "Job detail retrieved successfully");
    } catch (error) {
      console.error("Error retrieving job detail:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new JobController();
