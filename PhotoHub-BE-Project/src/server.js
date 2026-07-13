const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket");
const PORT = process.env.PORT || 3000;

const { connectMongo } = require("./mongo");
const { warmupModel } = require("./modules/airecomment/services/aiService");
const { startGroupBookingScheduler } = require("./modules/group_booking/services/groupBooking.scheduler");

async function runGroupBookingMigration() {
  try {
    const { GroupBooking } = require("./modules/group_booking/models/groupBooking.model");
    const { Booking } = require("./modules/bookings/models/booking.model");

    const groups = await GroupBooking.find({ scheduledBooking: { $ne: null } });
    let count = 0;
    for (const group of groups) {
      const res = await Booking.updateOne(
        { _id: group.scheduledBooking, groupBooking: null },
        { $set: { groupBooking: group._id } }
      );
      if (res.modifiedCount > 0) {
        count++;
      }
    }
    if (count > 0) {
      console.log(`[Migration] Đã liên kết groupBooking cho ${count} bookings cũ.`);
    }
  } catch (err) {
    console.error("[Migration Error] groupBooking migration:", err.message);
  }
}

async function startServer() {
  try {
    await connectMongo();
    console.log("Database connected");

    // Chạy migration bất đồng bộ sau khi kết nối DB
    runGroupBookingMigration().catch(err => console.error("Migration failed:", err));

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