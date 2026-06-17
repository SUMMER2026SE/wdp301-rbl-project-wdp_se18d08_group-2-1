const { Server } = require("socket.io");
const { registerChatHandlers } = require("./modules/photographers/chat/chat.socket");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // Register module-specific handlers
    registerChatHandlers(io, socket);

    socket.onAny((event, ...args) => {
      console.log("event received:", event, args);
    });

    socket.on("join-showtime", (showtimeUUID) => {
      socket.join(showtimeUUID);
      console.log(`${socket.id} joined room ${showtimeUUID}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };
