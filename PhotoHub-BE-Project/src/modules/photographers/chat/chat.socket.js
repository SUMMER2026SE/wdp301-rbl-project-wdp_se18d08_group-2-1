const chatService = require("./chat.service");

const registerChatHandlers = (io, socket) => {
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  socket.on("sendMessage", async ({ conversationId, senderId, text }) => {
    try {
      if (!conversationId || !senderId || !text) {
        console.error("Invalid sendMessage arguments:", { conversationId, senderId, text });
        return;
      }

      const savedMessage = await chatService.createMessage(conversationId, senderId, text);
      io.to(conversationId).emit("receiveMessage", savedMessage);
    } catch (error) {
      console.error("Error in socket sendMessage:", error.message);
      socket.emit("chatError", { message: error.message });
    }
  });
};

module.exports = { registerChatHandlers };
