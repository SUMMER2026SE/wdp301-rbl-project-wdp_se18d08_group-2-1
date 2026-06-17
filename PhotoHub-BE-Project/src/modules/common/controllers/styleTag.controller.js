const StyleTagService = require("../services/styleTag.service");
const ApiResponse = require("../../../utils/ApiResponse");

class StyleTagController {
  async create(req, res) {
    try {
      const result =
        await StyleTagService.createStyleTag(req.body);

      return ApiResponse.success(
        res,
        result,
        "Style tag created successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getAll(req, res) {
    try {
      const result =
        await StyleTagService.getAllStyleTags();

      return ApiResponse.success(res, result);
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getById(req, res) {
    try {
      const result =
        await StyleTagService.getStyleTagById(
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
        await StyleTagService.updateStyleTag(
          req.params.id,
          req.body
        );

      return ApiResponse.success(
        res,
        result,
        "Style tag updated successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async delete(req, res) {
    try {
      const result =
        await StyleTagService.deleteStyleTag(
          req.params.id
        );

      return ApiResponse.success(
        res,
        result,
        "Style tag deleted successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }
}

module.exports = new StyleTagController();