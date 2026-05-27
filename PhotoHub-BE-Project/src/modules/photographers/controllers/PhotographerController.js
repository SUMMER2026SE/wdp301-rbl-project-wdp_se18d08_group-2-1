// controllers/PhotographerController.js
const PhotographerService = require("../services/PhotographerService");
const ApiResponse = require("../../../utils/ApiResponse");

class PhotographerController {
  // Search & filter photographers
  async searchPhotographers(req, res) {
    try {
      const result = await PhotographerService.searchPhotographers(req.query);
      return res.status(200).json(new ApiResponse(200, result, "Search successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Lấy chi tiết photographer
  async getPhotographerDetail(req, res) {
    try {
      const { id } = req.params;
      const photographer = await PhotographerService.getPhotographerDetail(id);
      return res.status(200).json(new ApiResponse(200, photographer, "Get photographer detail successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Lấy top photographers (featured)
  async getTopPhotographers(req, res) {
    try {
      const { limit } = req.query;
      const photographers = await PhotographerService.getTopPhotographers(limit);
      return res.status(200).json(new ApiResponse(200, photographers, "Get top photographers successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Lấy danh sách styles
  async getStyles(req, res) {
    try {
      const styles = await PhotographerService.getAllPhotographyStyles();
      return res.status(200).json(new ApiResponse(200, styles, "Get styles successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Lấy danh sách locations
  async getLocations(req, res) {
    try {
      const locations = await PhotographerService.getAllPhotographyLocations();
      return res.status(200).json(new ApiResponse(200, locations, "Get locations successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Tạo photographer profile (khi user upgrade to photographer)
  async createPhotographerProfile(req, res) {
    try {
      const userId = req.user.id; // Từ middleware authenticate
      const profileData = req.body;
      const photographer = await PhotographerService.createPhotographerProfile(userId, profileData);
      return res.status(201).json(new ApiResponse(201, photographer, "Photographer profile created"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Cập nhật photographer profile
  async updatePhotographerProfile(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const photographer = await PhotographerService.updatePhotographerProfile(id, updateData);
      return res.status(200).json(new ApiResponse(200, photographer, "Photographer profile updated"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  // Lấy photographer của current user
  async getMyPhotographerProfile(req, res) {
    try {
      const userId = req.user.id;
      const photographer = await PhotographerService.getPhotographerByUserId(userId);
      if (!photographer) {
        return res.status(404).json(new ApiResponse(404, null, "Photographer profile not found"));
      }
      return res.status(200).json(new ApiResponse(200, photographer, "Get my photographer profile successful"));
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }
}

module.exports = new PhotographerController();
