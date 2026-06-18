const communityService = require("./community.service");
const ApiResponse = require("../../utils/ApiResponse");

const getViewerId = (req) => req.user?.id || req.user?._id || null;

class CommunityController {
  async listPosts(req, res) {
    try {
      const result = await communityService.listPosts(req.query, getViewerId(req));
      return ApiResponse.success(res, result, "Community posts retrieved successfully");
    } catch (error) {
      console.error("Error listing community posts:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getPost(req, res) {
    try {
      const post = await communityService.getPostById(req.params.id, getViewerId(req));
      return ApiResponse.success(res, post, "Community post retrieved successfully");
    } catch (error) {
      console.error("Error retrieving community post:", error);
      return ApiResponse.error(res, error.message, 404);
    }
  }

  async createPost(req, res) {
    try {
      const post = await communityService.createPost(getViewerId(req), req.body, req.file);
      return ApiResponse.success(res, post, "Community post published successfully", 201);
    } catch (error) {
      console.error("Error creating community post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async toggleLike(req, res) {
    try {
      const post = await communityService.toggleLike(req.params.id, getViewerId(req));
      return ApiResponse.success(res, post, "Community post like updated successfully");
    } catch (error) {
      console.error("Error toggling community like:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async toggleSave(req, res) {
    try {
      const post = await communityService.toggleSave(req.params.id, getViewerId(req));
      return ApiResponse.success(res, post, "Community post save updated successfully");
    } catch (error) {
      console.error("Error toggling community save:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async addComment(req, res) {
    try {
      const post = await communityService.addComment(
        req.params.id,
        getViewerId(req),
        req.body.content,
        req.body.parentComment
      );
      return ApiResponse.success(res, post, "Comment added successfully", 201);
    } catch (error) {
      console.error("Error adding community comment:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async deletePost(req, res) {
    try {
      const result = await communityService.deletePost(req.params.id, req.user);
      return ApiResponse.success(res, result, "Community post deleted successfully");
    } catch (error) {
      console.error("Error deleting community post:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new CommunityController();
