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
}

module.exports = new PhotographerPackageController();