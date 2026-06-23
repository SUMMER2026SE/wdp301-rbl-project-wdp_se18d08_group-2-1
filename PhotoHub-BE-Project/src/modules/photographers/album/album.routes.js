const express = require("express");
const multer = require("multer");
const albumController = require("./album.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

// Dùng memoryStorage để upload thẳng lên Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB mỗi ảnh
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

router.post(
  "/",
  authenticate,
  authorize(["photographer"]),
  upload.array("images", 200), // tối đa 200 ảnh
  albumController.uploadAlbum
);

router.get("/:bookingId", authenticate, albumController.getAlbum);

module.exports = router;
