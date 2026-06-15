// src/modules/airecomment/routes/airecommendRoutes.js

const express = require("express");
const multer = require("multer");
const { authenticate } = require("../../../middlewares/authenticate");
const { uploadPortfolioImage, getPortfoliosByPhotographer } = require("../controllers/PortfolioController");
const { recommendPhotographers } = require("../controllers/RecommendController");

const router = express.Router();

const storage = multer.memoryStorage();

const imageFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Định dạng không hỗ trợ: ${file.mimetype}. Chỉ chấp nhận JPEG, PNG, WebP, GIF.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File quá lớn. Kích thước tối đa là 10MB",
      LIMIT_UNEXPECTED_FILE: err.message || "File không hợp lệ",
      LIMIT_FILE_COUNT: "Chỉ được upload 1 file mỗi lần",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Lỗi upload: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

/**
 * POST /api/airecommend/portfolio/upload
 */
router.post(
  "/portfolio/upload",
  authenticate,
  upload.single("image"),
  handleMulterError,
  uploadPortfolioImage
);

/**
 * POST /api/airecommend/search
 */
router.post(
  "/search",
  upload.single("image"),
  handleMulterError,
  recommendPhotographers
);

/**
 * GET /api/airecommend/portfolio/photographer/:photographerId
 */
router.get(
  "/portfolio/photographer/:photographerId",
  getPortfoliosByPhotographer
);

module.exports = router;
