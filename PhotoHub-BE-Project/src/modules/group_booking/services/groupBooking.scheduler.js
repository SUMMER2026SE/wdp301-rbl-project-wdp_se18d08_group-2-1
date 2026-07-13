/**
 * groupBooking.scheduler.js
 *
 * Cron-like scheduler cho Group Booking.
 * Chạy nền mỗi 60 giây để:
 *   1. Hủy các nhóm PENDING đã hết hạn mà chưa đủ minMembers (UC104)
 *   2. Chốt các nhóm đã hết hạn nhưng đủ minMembers (UC103)
 *
 * Không cần cài thêm thư viện — sử dụng setInterval thuần Node.js.
 * Gọi startGroupBookingScheduler() trong server.js sau khi DB connected.
 */

const groupBookingService = require("./groupBooking.service");

const INTERVAL_MS = 60 * 1000; // 60 giây

let _schedulerHandle = null;
let _isRunning = false;

/**
 * Hàm chạy một lần kiểm tra — có guard để tránh chạy song song.
 */
async function runSchedulerTick() {
  if (_isRunning) {
    console.log("[GroupBooking Scheduler] Tick bỏ qua — lần trước chưa hoàn thành");
    return;
  }
  _isRunning = true;
  try {
    await groupBookingService.cancelExpiredGroups();
  } catch (err) {
    console.error("[GroupBooking Scheduler] Lỗi trong tick:", err.message);
  } finally {
    _isRunning = false;
  }
}

/**
 * Khởi động scheduler.
 * Gọi sau khi MongoDB đã kết nối thành công.
 */
function startGroupBookingScheduler() {
  if (_schedulerHandle) {
    console.log("[GroupBooking Scheduler] Đã chạy rồi, bỏ qua");
    return;
  }

  console.log(
    `[GroupBooking Scheduler] Khởi động — chạy mỗi ${INTERVAL_MS / 1000} giây`
  );

  // Chạy lần đầu ngay lập tức (sau 3 giây để DB ổn định)
  setTimeout(runSchedulerTick, 3000);

  // Sau đó chạy định kỳ
  _schedulerHandle = setInterval(runSchedulerTick, INTERVAL_MS);

  // Đảm bảo không giữ process sống nếu là tiến trình duy nhất
  if (_schedulerHandle.unref) {
    _schedulerHandle.unref();
  }
}

/**
 * Dừng scheduler (dùng khi graceful shutdown).
 */
function stopGroupBookingScheduler() {
  if (_schedulerHandle) {
    clearInterval(_schedulerHandle);
    _schedulerHandle = null;
    console.log("[GroupBooking Scheduler] Đã dừng");
  }
}

module.exports = { startGroupBookingScheduler, stopGroupBookingScheduler };
