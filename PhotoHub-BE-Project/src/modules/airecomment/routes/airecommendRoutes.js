// src/modules/airecomment/routes/airecommendRoutes.js

const express = require("express");
const multer = require("multer");
const { authenticate } = require("../../../middlewares/authenticate");
const {
  // Mới
  createAlbum,
  uploadImageToAlbum,
  getAlbumsByPhotographer,
  getAlbumDetail,
  deleteAlbum,
  deletePortfolioImage,
  // Legacy
  uploadPortfolioImage,
  getPortfoliosByPhotographer,
} = require("../controllers/PortfolioController");
const { recommendPhotographers } = require("../controllers/RecommendController");

const router = express.Router();

// ── Multer config ─────────────────────────────────────────────────────────
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
    fileSize: 10 * 1024 * 1024, // 10MB
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
    return res.status(400).json({ success: false, message: err.message });
  }

  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// ALBUM ROUTES (MỚI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/airecommend/portfolio/album
 * Tạo album mới (có thể kèm ảnh bìa)
 * Requires: authenticate (photographer)
 */
router.post(
  "/portfolio/album",
  authenticate,
  upload.single("coverImage"),
  handleMulterError,
  createAlbum
);

/**
 * POST /api/airecommend/portfolio/album/:albumId/image
 * Upload ảnh vào album (sinh AI Embedding)
 * Requires: authenticate (photographer)
 */
router.post(
  "/portfolio/album/:albumId/image",
  authenticate,
  upload.single("image"),
  handleMulterError,
  uploadImageToAlbum
);

/**
 * GET /api/airecommend/portfolio/photographer/:photographerId/albums
 * Lấy danh sách albums (kèm imageCount, ảnh bìa, category, styleTags)
 */
router.get(
  "/portfolio/photographer/:photographerId/albums",
  getAlbumsByPhotographer
);

/**
 * GET /api/airecommend/portfolio/album/:albumId
 * Lấy chi tiết 1 album + tất cả ảnh trong album
 */
router.get("/portfolio/album/:albumId", getAlbumDetail);

/**
 * DELETE /api/airecommend/portfolio/album/:albumId
 * Xóa album và toàn bộ ảnh trong album
 * Requires: authenticate (photographer)
 */
router.delete(
  "/portfolio/album/:albumId",
  authenticate,
  deleteAlbum
);

/**
 * DELETE /api/airecommend/portfolio/image/:imageId
 * Xóa 1 ảnh khỏi album
 * Requires: authenticate (photographer)
 */
router.delete(
  "/portfolio/image/:imageId",
  authenticate,
  deletePortfolioImage
);

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ROUTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/airecommend/search
 * Tìm kiếm photographer phù hợp bằng ảnh (AI Vector Search)
 * Public — không cần đăng nhập
 */
router.post(
  "/search",
  upload.single("image"),
  handleMulterError,
  recommendPhotographers
);

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY ROUTES (giữ nguyên để FE cũ không bị ảnh hưởng)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * [LEGACY] POST /api/airecommend/portfolio/upload
 * Upload ảnh portfolio trực tiếp (không qua album)
 * Requires: authenticate (photographer)
 */
router.post(
  "/portfolio/upload",
  authenticate,
  upload.single("image"),
  handleMulterError,
  uploadPortfolioImage
);

/**
 * [LEGACY] GET /api/airecommend/portfolio/photographer/:photographerId
 * Lấy danh sách albums của photographer (alias của route albums mới)
 */
router.get(
  "/portfolio/photographer/:photographerId",
  getPortfoliosByPhotographer
);

module.exports = router;
