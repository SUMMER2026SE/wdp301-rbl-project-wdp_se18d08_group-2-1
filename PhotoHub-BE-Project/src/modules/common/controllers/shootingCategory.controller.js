const ShootingCategoryService = require("../services/shootingCategory.service");
const ApiResponse = require("../../../utils/ApiResponse");

class ShootingCategoryController {
  async create(req, res) {
    try {
      const result =
        await ShootingCategoryService.createCategory(req.body);

      return ApiResponse.success(
        res,
        result,
        "Category created successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getAll(req, res) {
    try {
      const result =
        await ShootingCategoryService.getAllCategories();

      return ApiResponse.success(res, result);
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getById(req, res) {
    try {
      const result =
        await ShootingCategoryService.getCategoryById(
          req.params.id
        );

      return ApiResponse.success(res, result);
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async update(req, res) {
    try {
      const result =
        await ShootingCategoryService.updateCategory(
          req.params.id,
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        "Category updated successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async delete(req, res) {
    try {
      const result =
        await ShootingCategoryService.deleteCategory(
          req.params.id
        );

      return ApiResponse.success(
        res,
        result,
        "Category deleted successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }
}

module.exports = new ShootingCategoryController();