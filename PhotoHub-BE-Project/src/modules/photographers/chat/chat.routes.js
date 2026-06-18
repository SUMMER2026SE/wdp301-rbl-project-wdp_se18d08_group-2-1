const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const chatController = require("./chat.controller");
const { authenticate } = require("../../../middlewares/authenticate");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../../../uploads/chat");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") ||
      ["application/pdf", "application/zip"].includes(file.mimetype) ||
      file.mimetype.includes("word") ||
      file.mimetype.includes("officedocument");

    if (!allowed) {
      return cb(new Error("Only images, PDF, ZIP, and document files are allowed"), false);
    }

    cb(null, true);
  },
});

router.get("/conversations", authenticate, chatController.getConversations);
router.get("/messages/:conversationId", authenticate, chatController.getMessages);
router.post(
  "/messages/:conversationId",
  authenticate,
  upload.array("attachments", 10),
  chatController.sendMessage
);
router.post("/conversations", authenticate, chatController.createConversation);

module.exports = router;
