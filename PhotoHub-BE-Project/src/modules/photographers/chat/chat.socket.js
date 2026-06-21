const chatService = require("./chat.service");

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const emitMessageToParticipants = (io, conversation, message) => {
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
        message: messagePayload,
      });
    }
  });
};

const registerChatHandlers = (io, socket) => {
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;
    socket.join(String(conversationId));
    console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  socket.on("sendMessage", async ({ conversationId, senderId, text, messageType, attachments, metadata }) => {
    try {
      if (!conversationId || !senderId || (!text && (!attachments || attachments.length === 0))) {
        console.error("Invalid sendMessage arguments:", { conversationId, senderId, text, attachments });
        return;
      }

      const savedMessage = await chatService.createMessage(conversationId, senderId, {
        text,
        messageType,
        attachments,
        metadata,
      });
      const conversation = await chatService.getConversationById(conversationId);
      emitMessageToParticipants(io, conversation, savedMessage);
    } catch (error) {
      console.error("Error in socket sendMessage:", error.message);
      socket.emit("chatError", { message: error.message });
    }
  });
};

module.exports = { registerChatHandlers };
