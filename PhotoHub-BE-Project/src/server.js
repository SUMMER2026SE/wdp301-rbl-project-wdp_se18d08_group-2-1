const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket");
const PORT = process.env.PORT || 3000;

const { connectMongo } = require("./mongo");
const { warmupModel } = require("./modules/airecomment/services/aiService");
const { startGroupBookingScheduler } = require("./modules/group_booking/services/groupBooking.scheduler");

async function startServer() {
  try {
    await connectMongo();
    console.log("Database connected");

    // Warm up AI model in background
    warmupModel();

    // Khởi động Group Booking scheduler (UC103, UC104)
    startGroupBookingScheduler();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message || err);
    process.exit(1);
  }
}

startServer();