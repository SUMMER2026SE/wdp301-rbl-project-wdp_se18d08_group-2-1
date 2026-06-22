const albumService = require("./album.service");
const ApiResponse = require("../../../utils/ApiResponse");
const { uploadBufferToCloudinary } = require("../../../utils/cloudinaryUpload");

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

      console.log(`[Album] Uploading ${req.files.length} images to Cloudinary for booking ${bookingId}`);

      // Upload all buffers to Cloudinary concurrently (hỗ trợ file lớn hơn 10MB)
      const uploadPromises = req.files.map(async (file, index) => {
        const uploaded = await uploadBufferToCloudinary(file.buffer, file.mimetype, {
          folder: "photohub/albums",
        });

        console.log(`[Album] Image ${index + 1}/${req.files.length} uploaded ✅ (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

        return {
          url: uploaded.secure_url,
          previewUrl: uploaded.secure_url,
          watermarkUrl: uploaded.secure_url,
          downloadUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date(),
        };
      });

      const images = await Promise.all(uploadPromises);

      console.log(`[Album] All ${images.length} images uploaded successfully.`);

      const album = await albumService.createOrUpdateAlbum(bookingId, req.user.id, images);
      return ApiResponse.success(res, album, "Album images uploaded successfully", 201);
    } catch (error) {
      console.error("Error uploading album:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getAlbum(req, res) {
    try {
      const { bookingId } = req.params;
      const album = await albumService.getAlbumByBookingId(bookingId, req.user);
      return ApiResponse.success(res, album, "Album retrieved successfully");
    } catch (error) {
      console.error("Error retrieving album:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new AlbumController();
