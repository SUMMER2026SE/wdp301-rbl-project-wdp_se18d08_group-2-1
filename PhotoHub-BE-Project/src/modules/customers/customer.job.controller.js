const customerJobService = require("./customer.job.service");
const ApiResponse = require("../../utils/ApiResponse");

class CustomerJobController {
  async createJobPost(req, res) {
    try {
      const imageUrls = req.files ? req.files.map((f) => f.path) : [];
      const job = await customerJobService.createJobPost(
        req.user.id,
        req.body,
        imageUrls
      );
      return ApiResponse.success(res, job, "Job post đã được tạo thành công!", 201);
    } catch (error) {
      console.error("Error creating job post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getMyJobPosts(req, res) {
    try {
      const jobs = await customerJobService.getMyJobPosts(req.user.id);
      return ApiResponse.success(res, jobs, "Danh sách job post của bạn");
    } catch (error) {
      console.error("Error fetching customer job posts:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async uploadReferenceImages(req, res) {
    try {
      const { id } = req.params;
      const imageUrls = req.files ? req.files.map((f) => f.path) : [];

      if (imageUrls.length === 0) {
        return ApiResponse.error(res, "Vui lòng chọn ít nhất 1 ảnh mẫu.", 400);
      }

      const job = await customerJobService.updateReferenceImages(id, req.user.id, imageUrls);
      return ApiResponse.success(res, job, "Ảnh mẫu đã được cập nhật thành công!");
    } catch (error) {
      console.error("Error uploading reference images:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deleteJobPost(req, res) {
    try {
      const { id } = req.params;
      const result = await customerJobService.deleteJobPost(id, req.user.id);
      return ApiResponse.success(res, result, "Job post đã được xóa.");
    } catch (error) {
      console.error("Error deleting job post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async closeJobPost(req, res) {
    try {
      const { id } = req.params;
      const job = await customerJobService.closeJobPost(id, req.user.id);
      return ApiResponse.success(res, job, "Job post đã được đóng.");
    } catch (error) {
      console.error("Error closing job post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async updateJobPost(req, res) {
    try {
      const { id } = req.params;
      const imageUrls = req.files ? req.files.map((f) => f.path) : [];
      const job = await customerJobService.updateJobPost(
        id,
        req.user.id,
        req.body,
        imageUrls
      );
      return ApiResponse.success(res, job, "Job post đã được cập nhật thành công!");
    } catch (error) {
      console.error("Error updating job post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new CustomerJobController();
