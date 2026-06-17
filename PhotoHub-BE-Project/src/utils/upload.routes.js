const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");

// upload nhiều ảnh
router.post("/images", upload.array("images", 10), (req, res) => {
  try {
    const files = req.files.map(file => file.path);

    return res.json({
      success: true,
      data: files
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;