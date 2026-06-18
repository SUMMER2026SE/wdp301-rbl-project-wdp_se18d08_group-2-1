const albumService = require("./album.service");
const ApiResponse = require("../../../utils/ApiResponse");

class AlbumController {
  async uploadAlbum(req, res) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        throw new Error("bookingId is required");
      }

      if (!req.files || req.files.length === 0) {
        throw new Error("No files uploaded");
      }

      const images = req.files.map((file) => ({
        url: `/uploads/albums/${file.filename}`,
        previewUrl: `/uploads/albums/${file.filename}`,
        watermarkUrl: `/uploads/albums/${file.filename}`,
        downloadUrl: `/uploads/albums/${file.filename}`,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      }));

      const album = await albumService.createOrUpdateAlbum(bookingId, req.user.id, images);
      return ApiResponse.success(res, album, "Album images uploaded successfully", 201);
    } catch (error) {
      console.error("Error uploading album:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getAlbum(req, res) {
    try {
      const { bookingId } = req.params;
      const album = await albumService.getAlbumByBookingId(bookingId, req.user);
      return ApiResponse.success(res, album, "Album retrieved successfully");
    } catch (error) {
      console.error("Error retrieving album:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new AlbumController();
