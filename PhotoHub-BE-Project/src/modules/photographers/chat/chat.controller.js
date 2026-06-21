const chatService = require("./chat.service");
const ApiResponse = require("../../../utils/ApiResponse");

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const emitConversationUpdate = (conversation, payload = {}) => {
  try {
    const { getIO } = require("../../../socket");
    const io = getIO();
    const conversationId = normalizeId(conversation?._id || payload.conversationId);
    if (!conversationId) return;

    const eventPayload = {
      conversationId,
      conversation,
      ...payload,
    };

    io.to(conversationId).emit("conversationUpdated", eventPayload);
    (conversation?.participants || []).forEach((participant) => {
      const participantId = normalizeId(participant);
      if (participantId) {
        io.to(`user:${participantId}`).emit("conversationUpdated", eventPayload);
      }
    });
  } catch (_socketError) {
    // REST delivery still succeeds when socket server is not initialized in tests.
  }
};

const emitMessage = (conversation, message) => {
  try {
    const { getIO } = require("../../../socket");
    const io = getIO();
    const conversationId = normalizeId(conversation?._id || message?.conversationId);
    if (!conversationId) return;

    const messagePayload = typeof message?.toObject === "function" ? message.toObject() : { ...message };
    messagePayload.conversationId = normalizeId(messagePayload.conversationId || conversationId);

    io.to(conversationId).emit("receiveMessage", messagePayload);
    (conversation?.participants || []).forEach((participant) => {
      const participantId = normalizeId(participant);
      if (participantId) {
        io.to(`user:${participantId}`).emit("receiveMessage", messagePayload);
        io.to(`user:${participantId}`).emit("conversationUpdated", {
          conversationId,
          conversation,
          message: messagePayload,
        });
      }
    });
  } catch (_socketError) {
    // REST delivery still succeeds when socket server is not initialized in tests.
  }
};

class ChatController {
  async getConversations(req, res) {
    try {
      const list = await chatService.getConversations(req.user.id);
      return ApiResponse.success(res, list, "Conversations retrieved successfully");
    } catch (error) {
      console.error("Error retrieving conversations:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const list = await chatService.getMessages(conversationId, req.user.id);
      return ApiResponse.success(res, list, "Messages retrieved successfully");
    } catch (error) {
      console.error("Error retrieving messages:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async createConversation(req, res) {
    try {
      const { recipientId, bookingId, jobPostId } = req.body;
      if (!recipientId) {
        throw new Error("Recipient ID is required");
      }
      const conversation = await chatService.findOrCreateConversation(
        [req.user.id, recipientId],
        bookingId,
        jobPostId
      );
      emitConversationUpdate(conversation, { conversation });
      return ApiResponse.success(res, conversation, "Conversation established successfully");
    } catch (error) {
      console.error("Error creating conversation:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const attachments = (req.files || []).map((file) => ({
        url: `/uploads/chat/${file.filename}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      }));
      const metadata =
        typeof req.body.metadata === "string"
          ? JSON.parse(req.body.metadata || "{}")
          : req.body.metadata || {};

      const message = await chatService.createMessage(conversationId, req.user.id, {
        text: req.body.text,
        messageType: req.body.messageType || (attachments.length ? "file" : "text"),
        attachments,
        metadata,
      });

      const conversation = await chatService.getConversationById(conversationId);
      emitMessage(conversation, message);

      return ApiResponse.success(res, message, "Message sent successfully", 201);
    } catch (error) {
      console.error("Error sending message:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new ChatController();
