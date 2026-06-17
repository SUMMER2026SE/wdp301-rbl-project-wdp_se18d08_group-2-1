const mongoose = require("mongoose");
const FavoritePhotographerService = require("../services/FavoritePhotographerService");
const ApiResponse = require("../../../utils/ApiResponse");

class FavoritePhotographerController {
  // Thêm yêu thích
  async addFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { photographerId } = req.body;

      if (!photographerId || !mongoose.Types.ObjectId.isValid(photographerId)) {
        return ApiResponse.error(res, "photographerId không hợp lệ.", 400);
      }

      const result = await FavoritePhotographerService.addFavorite(userId, photographerId);
      return ApiResponse.success(res, result, "Đã thêm vào danh sách yêu thích.", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Xóa yêu thích
  async removeFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { photographerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(photographerId)) {
        return ApiResponse.error(res, "photographerId không hợp lệ.", 400);
      }

      await FavoritePhotographerService.removeFavorite(userId, photographerId);
      return ApiResponse.success(res, null, "Đã xóa khỏi danh sách yêu thích.");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Lấy danh sách
  async getFavorites(req, res) {
    try {
      const userId = req.user.id;
      const result = await FavoritePhotographerService.getFavorites(userId);
      return ApiResponse.success(res, result, "Lấy danh sách yêu thích thành công.");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  // Kiểm tra trạng thái yêu thích
  async checkFavoriteStatus(req, res) {
    try {
      const userId = req.user.id;
      const { photographerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(photographerId)) {
        return ApiResponse.error(res, "photographerId không hợp lệ.", 400);
      }

      const result = await FavoritePhotographerService.checkFavoriteStatus(userId, photographerId);
      return ApiResponse.success(res, result, "Kiểm tra trạng thái yêu thích thành công.");
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new FavoritePhotographerController();
