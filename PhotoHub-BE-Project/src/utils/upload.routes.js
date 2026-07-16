const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middlewares/upload.middleware");
const { uploadBufferToCloudinary } = require("./cloudinaryUpload");

const MAX_FILES = 100;

const getUploadErrorStatus = (err) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") return 413;
  if (err instanceof multer.MulterError) return 400;
  return 500;
};

router.post("/images", (req, res) => {
  upload.array("images", MAX_FILES)(req, res, async (err) => {
    if (err) {
      console.error("[Upload] Multer error:", err.message);
      return res.status(getUploadErrorStatus(err)).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Please upload an image under 300MB."
          : "Upload error: " + err.message,
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No image file was uploaded",
        });
      }

      const invalidFile = req.files.find((file) => !String(file.mimetype || "").startsWith("image/"));
      if (invalidFile) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      console.log(`[Upload] Uploading ${req.files.length} package image(s)...`);

      const uploadPromises = req.files.map(async (file, index) => {
        const result = await uploadBufferToCloudinary(file.buffer, file.mimetype, {
          folder: "photohub/packages",
          localFolder: "packages",
          originalName: file.originalname,
        });

        const url = result?.secure_url || result?.url;
        if (!url) {
          throw new Error(`Image ${index + 1} could not be uploaded to Cloudinary`);
        }

        if (result?.storage === "local" || String(url).includes("/uploads/")) {
          throw new Error(`Image ${index + 1} was stored locally instead of Cloudinary`);
        }
        console.log(`[Upload] Image ${index + 1}/${req.files.length} ok (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return url;
      });

      const urls = (await Promise.all(uploadPromises)).filter(Boolean);
      if (urls.length !== req.files.length) {
        return res.status(500).json({
          success: false,
          message: "Some images could not be uploaded",
        });
      }

      return res.json({ success: true, data: urls });
    } catch (catchErr) {
      console.error("[Upload] Failed to upload images:", catchErr.message);
      return res.status(500).json({
        success: false,
        message: catchErr.message,
      });
    }
  });
});

module.exports = router;
