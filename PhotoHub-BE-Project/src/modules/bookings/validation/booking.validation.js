/**
 * booking.validation.js
 * Middleware validation cho các request liên quan đến Booking.
 */

// ─── Tạo booking mới ─────────────────────────────────────────────
const validateCreateBooking = (req, res, next) => {
  const { photographerUserId, title, start, end, location, price } = req.body;
  const errors = [];

  if (!photographerUserId) {
    errors.push("photographerUserId là bắt buộc");
  }
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    errors.push("title phải có ít nhất 3 ký tự");
  }
  if (!start) {
    errors.push("start (thời gian bắt đầu) là bắt buộc");
  }
  if (!end) {
    errors.push("end (thời gian kết thúc) là bắt buộc");
  }
  if (start && end && new Date(start) >= new Date(end)) {
    errors.push("Thời gian kết thúc phải sau thời gian bắt đầu");
  }
  if (start && new Date(start) <= new Date()) {
    errors.push("Không thể đặt lịch trong quá khứ");
  }
  if (!location || typeof location !== "string" || location.trim().length < 2) {
    errors.push("location là bắt buộc (ít nhất 2 ký tự)");
  }
  if (price === undefined || price === null) {
    errors.push("price là bắt buộc");
  }
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    errors.push("price phải là số không âm");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

// ─── Từ chối booking ─────────────────────────────────────────────
const validateRejectBooking = (req, res, next) => {
  const { reason } = req.body;
  if (reason && typeof reason !== "string") {
    return res.status(400).json({ success: false, message: "reason phải là chuỗi ký tự" });
  }
  next();
};

module.exports = {
  validateCreateBooking,
  validateRejectBooking,
};
