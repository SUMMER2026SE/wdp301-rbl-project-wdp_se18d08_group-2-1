const express = require("express");
const chatController = require("./chat.controller");
const { authenticate } = require("../../../middlewares/authenticate");

const router = express.Router();

router.get("/conversations", authenticate, chatController.getConversations);
router.get("/messages/:conversationId", authenticate, chatController.getMessages);
router.post("/conversations", authenticate, chatController.createConversation);

module.exports = router;
