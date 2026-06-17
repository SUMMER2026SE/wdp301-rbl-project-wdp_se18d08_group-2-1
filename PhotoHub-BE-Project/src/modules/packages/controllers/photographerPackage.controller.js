const ApiResponse = require("../../../utils/ApiResponse");
const PackageService = require("../services/photographerPackage.service");

class PhotographerPackageController {
    async create(req, res) {
        try {
            const result = await PackageService.createPackage(
                req.body,
                req.photographer._id
            );

            return ApiResponse.success(res, {
                message: "Create package successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }

    // Cập nhật để hỗ trợ filter: GET /api/packages?categoryIds=id1,id2&styleTagIds=id3
    async getMyPackages(req, res) {
        try {
            const { categoryIds, styleTagIds } = req.query;

            const filters = {
                categoryIds: categoryIds ? categoryIds.split(",") : [],
                styleTagIds: styleTagIds ? styleTagIds.split(",") : []
            };

            const result = await PackageService.getMyPackages(
                req.photographer._id,
                filters
            );

            return ApiResponse.success(res, {
                message: "Get my packages successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }

    async getPackageDetail(req, res) {
        try {
            const { id } = req.params; // Lấy packageId từ URL

            const result = await PackageService.getPackageDetail(id);

            if (!result) {
                return ApiResponse.error(res, {
                    statusCode: 404,
                    message: "Package not found"
                });
            }

            return ApiResponse.success(res, {
                message: "Get package detail successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }
    // MỚI: Update package
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await PackageService.updatePackage(id, req.body);
            
            return ApiResponse.success(res, {
                message: "Update package successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }

    // MỚI: Soft delete
    async softDelete(req, res) {
        try {
            const { id } = req.params;
            const result = await PackageService.softDeletePackage(id);
            
            return ApiResponse.success(res, {
                message: "Delete package successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }

    // MỚI: Toggle status (Active/Inactive)
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const result = await PackageService.toggleStatusPackage(id);
            
            return ApiResponse.success(res, {
                message: "Toggle status successfully",
                data: result
            });
        } catch (err) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: err.message
            });
        }
    }
}

module.exports = new PhotographerPackageController();