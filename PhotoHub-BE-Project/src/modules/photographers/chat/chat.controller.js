const chatService = require("./chat.service");
const ApiResponse = require("../../../utils/ApiResponse");

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
      const list = await chatService.getMessages(conversationId);
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
      return ApiResponse.success(res, conversation, "Conversation established successfully");
    } catch (error) {
      console.error("Error creating conversation:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new ChatController();
