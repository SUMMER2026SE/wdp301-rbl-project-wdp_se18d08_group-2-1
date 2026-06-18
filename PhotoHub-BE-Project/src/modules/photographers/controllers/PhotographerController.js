// controllers/PhotographerController.js
const fs = require("fs");
const path = require("path");

const PhotographerService = require("../services/PhotographerService");
const ApiResponse = require("../../../utils/ApiResponse");

class PhotographerController {
  // Search & filter photographers
  async searchPhotographers(req, res) {
    try {
      const result = await PhotographerService.searchPhotographers(req.query);
      return ApiResponse.success(res, result, "Search successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy danh sách photographers
  async listPhotographers(req, res) {
    try {
      const result = await PhotographerService.listPhotographers(req.query);
      return ApiResponse.success(res, result, "List photographers successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy chi tiết photographer
  async getPhotographerDetail(req, res) {
    try {
      const { id } = req.params;
      const photographer = await PhotographerService.getPhotographerDetail(id);
      return ApiResponse.success(res, photographer, "Get photographer detail successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy top photographers (featured)
  async getTopPhotographers(req, res) {
    try {
      const { limit } = req.query;
      const photographers = await PhotographerService.getTopPhotographers(limit);
      return ApiResponse.success(res, photographers, "Get top photographers successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy danh sách styles
  async getStyles(req, res) {
    try {
      const styles = await PhotographerService.getAllPhotographyStyles();
      return ApiResponse.success(res, styles, "Get styles successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy danh sách categories
  async getCategories(req, res) {
    try {
      const styles = await PhotographerService.getAllPhotographyCategories();
      return ApiResponse.success(res, styles, "Get categories successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }


  // Lấy danh sách locations
  async getLocations(req, res) {
    try {
      const locations = await PhotographerService.getAllPhotographyLocations();
      return ApiResponse.success(res, locations, "Get locations successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Tạo photographer profile
  async createPhotographerProfile(req, res) {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      const photographer = await PhotographerService.createPhotographerProfile(userId, profileData);
      return ApiResponse.success(res, photographer, "Photographer profile created", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Cập nhật photographer profile
  async updatePhotographerProfile(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const photographer = await PhotographerService.updatePhotographerProfile(id, updateData);
      return ApiResponse.success(res, photographer, "Photographer profile updated");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy photographer của current user
  async getMyPhotographerProfile(req, res) {
    try {
      const userId = req.user.id;
      const photographer = await PhotographerService.getPhotographerByUserId(userId);
      if (!photographer) {
        return ApiResponse.error(res, "Photographer profile not found", 404);
      }
      return ApiResponse.success(res, photographer, "Get my photographer profile successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async uploadVerification(req, res) {
    try {
      const result =
        await PhotographerService.uploadVerification(
          req.user.id,
          req.files
        );

      return ApiResponse.success(
        res,
        result,
        "Upload verification successful"
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        error.message,
        400
      );
    }
  }

  async getProfileStatus(req, res) {
    try {
      const result =
        await PhotographerService.getProfileStatus(
          req.user.id
        );

      return ApiResponse.success(
        res,
        result,
        "Get profile status successful"
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        error.message,
        400
      );
    }
  }
}



module.exports = new PhotographerController();
