/**
 * EmailService.js
 * Centralized email service dùng Nodemailer.
 */

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const FROM = `"${process.env.MAIL_FROM_NAME || "PhotoHub"}" <${process.env.MAIL_USER}>`;

// ─── Utility ──────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "short",
  });

const formatPrice = (p) =>
  Number(p).toLocaleString("vi-VN") + "₫";

// ═════════════════════════════════════════════════════════════════
//  AUTH EMAILS
// ═════════════════════════════════════════════════════════════════

/**
 * Gửi email OTP reset mật khẩu.
 * @param {string} to
 * @param {string} otp
 */
async function sendResetPasswordEmail(to, otp) {
  const mailOptions = {
    from: FROM,
    to,
    subject: "PhotoHub — Mã xác nhận đặt lại mật khẩu",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#f5a623;font-size:26px;letter-spacing:2px;">📸 PhotoHub</h1>
        </div>
        <div style="background:#fff;padding:32px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Đặt lại mật khẩu</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Xin chào! Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản
            <strong>${to}</strong>. Dưới đây là mã xác nhận của bạn:
          </p>
          <div style="text-align:center;background:#fff8ec;border:2px dashed #f5a623;border-radius:8px;padding:20px;margin-bottom:20px;">
            <span style="font-size:36px;font-weight:700;color:#f5a623;letter-spacing:8px;">${otp}</span>
          </div>
          <p style="color:#888;font-size:13px;margin:0;">
            ⏱ Mã có hiệu lực trong <strong>15 phút</strong>.
            Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>
        </div>
        <div style="background:#1a1a2e;padding:16px;text-align:center;">
          <p style="margin:0;color:#888;font-size:12px;">© 2024 PhotoHub. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Reset OTP → ${to} | msgId: ${info.messageId}`);
  return info;
}

// ═════════════════════════════════════════════════════════════════
//  BOOKING EMAILS
// ═════════════════════════════════════════════════════════════════

/**
 * Email xác nhận thanh toán thành công gửi cho KHÁCH HÀNG.
 *
 * @param {string} to - Email khách hàng
 * @param {Object} data
 * @param {string|ObjectId} data.bookingId
 * @param {string} data.customerName
 * @param {string} data.photographerName
 * @param {string} data.title
 * @param {string} data.location
 * @param {Date}   data.start
 * @param {Date}   data.end
 * @param {number} data.price
 */
async function sendBookingConfirmedToCustomer(to, data) {
  const { bookingId, customerName, photographerName, title, location, start, end, price } = data;
  const shortId = bookingId.toString().slice(-8).toUpperCase();

  const mailOptions = {
    from: FROM,
    to,
    subject: "📸 PhotoHub — Thanh toán đặt lịch thành công!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;background:#f5f5f5;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#f5a623;font-size:26px;letter-spacing:2px;">📸 PhotoHub</h1>
          <p style="margin:8px 0 0;color:#ccc;font-size:13px;">Nền tảng kết nối Nhiếp ảnh gia chuyên nghiệp</p>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;">
          <!-- Icon + title -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;background:#e8f5e9;border-radius:50%;width:72px;height:72px;font-size:36px;">✅</div>
            <h2 style="color:#1a1a2e;margin:16px 0 4px;font-size:22px;">Thanh toán thành công!</h2>
            <p style="color:#888;margin:0;font-size:14px;">Mã đặt lịch: <strong style="color:#0f3460;">#${shortId}</strong></p>
          </div>

          <p style="color:#444;font-size:15px;margin:0 0 24px;line-height:1.7;">
            Xin chào <strong>${customerName}</strong>,<br/>
            Booking của bạn với nhiếp ảnh gia <strong style="color:#f5a623;">${photographerName}</strong>
            đã được xác nhận và thanh toán thành công!
          </p>

          <!-- Details card -->
          <div style="background:#f9f9ff;border-left:4px solid #0f3460;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <h3 style="margin:0 0 16px;color:#0f3460;font-size:15px;text-transform:uppercase;letter-spacing:1px;">📋 Chi tiết buổi chụp</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;width:38%;">Chủ đề</td>
                <td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">${title}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">📍 Địa điểm</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${location}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">🕐 Bắt đầu</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${formatDate(start)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">🕔 Kết thúc</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${formatDate(end)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">💰 Thanh toán</td>
                <td style="padding:6px 0;color:#27ae60;font-size:16px;font-weight:700;">${formatPrice(price)}</td>
              </tr>
            </table>
          </div>

          <p style="color:#666;font-size:13px;line-height:1.7;margin:0;">
            Nếu có bất kỳ thắc mắc nào, hãy nhắn tin trực tiếp cho nhiếp ảnh gia trong ứng dụng PhotoHub.<br/>
            Chúc bạn có buổi chụp thật tuyệt vời! 🌟
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#1a1a2e;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#888;font-size:12px;">© 2024 PhotoHub. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Booking confirmed (customer) → ${to} | msgId: ${info.messageId}`);
  return info;
}

/**
 * Email thông báo lịch chụp đã thanh toán gửi cho NHIẾP ẢNH GIA.
 *
 * @param {string} to - Email nhiếp ảnh gia
 * @param {Object} data - Giống sendBookingConfirmedToCustomer
 */
async function sendBookingConfirmedToPhotographer(to, data) {
  const { bookingId, customerName, photographerName, title, location, start, end, price } = data;
  const shortId = bookingId.toString().slice(-8).toUpperCase();

  const mailOptions = {
    from: FROM,
    to,
    subject: "📸 PhotoHub — Bạn có lịch chụp mới đã thanh toán!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;background:#f5f5f5;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#f5a623;font-size:26px;letter-spacing:2px;">📸 PhotoHub</h1>
          <p style="margin:8px 0 0;color:#ccc;font-size:13px;">Thông báo lịch chụp mới</p>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;background:#fff3e0;border-radius:50%;width:72px;height:72px;font-size:36px;">🎉</div>
            <h2 style="color:#1a1a2e;margin:16px 0 4px;font-size:22px;">Lịch chụp đã xác nhận!</h2>
            <p style="color:#888;margin:0;font-size:14px;">Mã booking: <strong style="color:#0f3460;">#${shortId}</strong></p>
          </div>

          <p style="color:#444;font-size:15px;margin:0 0 24px;line-height:1.7;">
            Xin chào <strong>${photographerName}</strong>,<br/>
            Khách hàng <strong style="color:#f5a623;">${customerName}</strong>
            vừa hoàn tất thanh toán cho buổi chụp của bạn!
          </p>

          <!-- Details card -->
          <div style="background:#fff8f0;border-left:4px solid #f5a623;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <h3 style="margin:0 0 16px;color:#0f3460;font-size:15px;text-transform:uppercase;letter-spacing:1px;">📋 Chi tiết buổi chụp</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;width:38%;">Chủ đề</td>
                <td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">${title}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">📍 Địa điểm</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${location}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">🕐 Bắt đầu</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${formatDate(start)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">🕔 Kết thúc</td>
                <td style="padding:6px 0;color:#333;font-size:14px;">${formatDate(end)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:14px;">💰 Doanh thu</td>
                <td style="padding:6px 0;color:#27ae60;font-size:16px;font-weight:700;">${formatPrice(price)}</td>
              </tr>
            </table>
          </div>

          <p style="color:#666;font-size:13px;line-height:1.7;margin:0;">
            Hãy chuẩn bị thật tốt để có buổi chụp thành công!<br/>
            Bạn có thể nhắn tin với khách hàng ngay trong ứng dụng PhotoHub. 📱
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#1a1a2e;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#888;font-size:12px;">© 2024 PhotoHub. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Booking confirmed (photographer) → ${to} | msgId: ${info.messageId}`);
  return info;
}

module.exports = {
  sendResetPasswordEmail,
  sendBookingConfirmedToCustomer,
  sendBookingConfirmedToPhotographer,
};
