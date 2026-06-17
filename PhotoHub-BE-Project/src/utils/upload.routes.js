const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");

// upload nhiều ảnh
router.post("/images", (req, res, next) => {
  // Bọc middleware để chủ động bắt lỗi của Multer/Cloudinary
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      console.error("================ 🔥 LỖI TỪ MIDDLEWARE UPLOAD ================");
      console.error(err); // <--- CHÍNH LÀ NÓ! Lỗi sẽ phải hiện ở đây
      console.error("==========================================================");
      
      return res.status(500).json({
        success: false,
        message: "Lỗi cấu hình upload: " + err.message
      });
    }

    // Nếu không có lỗi ở middleware thì mới chạy tiếp vào đây
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "Không có file nào được truyền lên" });
      }

      const files = req.files.map(file => file.path);

      return res.json({
        success: true,
        data: files
      });
    } catch (catchErr) {
      console.error("🔥 Lỗi tại Controller:", catchErr);
      return res.status(500).json({
        success: false,
        message: catchErr.message
      });
    }
  });
});

module.exports = router;