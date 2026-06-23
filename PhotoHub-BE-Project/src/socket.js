/**
 * socket.js
 * Khởi tạo và quản lý Socket.IO server.
 */

const { Server } = require("socket.io");
const { registerChatHandlers } = require("./modules/photographers/chat/chat.socket");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─────────────────────────────────────────────────────────────
    // Join room theo userId — BẮT BUỘC để nhận thông báo cá nhân.
    //
    // Frontend gọi ngay sau khi connect:
    //   socket.emit("join-user-room", currentUser._id)
    //
    // Server dùng: io.to(`user:${userId}`).emit(eventName, data)
    // ─────────────────────────────────────────────────────────────
    socket.on("join-user-room", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] ${socket.id} joined room user:${userId}`);
      }
    });

    // Register chat handlers (module photographers)
    registerChatHandlers(io, socket);

    // Debug: log tất cả events nhận được
    socket.onAny((event, ...args) => {
      console.log(`[Socket] Event: ${event}`, args);
    });

    // Legacy: join room theo showtimeUUID (giữ lại để không break code cũ)
    socket.on("join-showtime", (showtimeUUID) => {
      socket.join(showtimeUUID);
      console.log(`[Socket] ${socket.id} joined showtime room: ${showtimeUUID}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io chưa được khởi tạo");
  return io;
};

module.exports = { initSocket, getIO };
