const nodemailer = require("nodemailer");

function hasMailConfig() {
  return Boolean(process.env.MAIL_USER && process.env.MAIL_PASSWORD);
}

let transporter = null;

function getTransporter() {
  if (!hasMailConfig()) {
    console.log("[EMAIL] Thiếu MAIL_USER hoặc MAIL_PASSWORD");
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      family: 4,

      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,

      auth: {
        user: process.env.MAIL_USER,
        pass: String(process.env.MAIL_PASSWORD).replace(/\s+/g, ""),
      },
    });

    console.log("[EMAIL CONFIG]", {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.MAIL_USER,
    });
  }

  return transporter;
}

/**
 * Gửi OTP xác thực email. Nếu chưa cấu hình SMTP → chỉ log console.
 */
async function sendVerifyEmailOtp(to, otp, fullName) {
  const name = fullName || "bạn";
  const t = getTransporter();

  if (!t) {
    console.log(`[EMAIL chưa cấu hình] OTP cho ${to}: ${otp}`);
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #E50914;">PHOTOHUB</h1>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Mã xác thực email của bạn:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #E50914;">${otp}</p>
      <p style="color: #666; font-size: 13px;">Có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này.</p>
    </div>
  `;

  try {

    await t.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "PHOTOHUB"}" <${process.env.MAIL_USER}>`,
      to,
      subject: "Mã xác thực email - PHOTOHUB",
      text: `Mã OTP của bạn: ${otp} (hiệu lực 15 phút)`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Đã gửi OTP tới ${to}`);

  } catch (err) {

    console.error("[EMAIL SEND ERROR]", {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
      errno: err.errno,
      syscall: err.syscall,
    });

    throw err;
  }
}

/**
 * Gửi email thông báo hồ sơ nhiếp ảnh gia đã được duyệt.
 */
async function sendApprovalEmail(to, fullName, adminNote) {
  const name = fullName || "bạn";
  const t = getTransporter();

  if (!t) {
    console.log(`[EMAIL chưa cấu hình] Thông báo duyệt cho ${to} | Ghi chú: ${adminNote}`);
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h1 style="color: #22c55e; text-align: center; margin-bottom: 24px;">PHOTOHUB</h1>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Chúng tôi xin vui mừng thông báo rằng hồ sơ đăng ký hoạt động nhiếp ảnh gia của bạn đã được <strong>Admin phê duyệt thành công</strong>!</p>
      <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #22c55e; margin: 16px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <p style="margin: 0; font-weight: bold; color: #4b5563;">Ghi chú từ quản trị viên:</p>
        <p style="margin: 8px 0 0 0; color: #1f2937; font-style: italic;">${adminNote || "Hồ sơ hợp lệ"}</p>
      </div>
      <p>Bây giờ bạn đã có thể bắt đầu đăng bán các gói dịch vụ chụp ảnh và nhận yêu cầu đặt lịch từ khách hàng trên hệ thống PhotoHub.</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:4200"}" style="background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Đến bảng điều khiển của bạn</a>
      </div>
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">Cảm ơn bạn đã đồng hành cùng PhotoHub!</p>
    </div>
  `;

  await t.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || "PHOTOHUB"}" <${process.env.MAIL_USER}>`,
    to,
    subject: "Hồ sơ đối tác đã được phê duyệt - PHOTOHUB",
    text: `Chúc mừng ${name}! Hồ sơ đăng ký hoạt động nhiếp ảnh gia của bạn đã được duyệt thành công. Ghi chú: ${adminNote || "Hồ sơ hợp lệ"}`,
    html: htmlContent,
  });
  console.log(`[EMAIL] Đã gửi email thông báo phê duyệt tới ${to}`);
}

/**
 * Gửi email thông báo hồ sơ nhiếp ảnh gia bị từ chối.
 */
async function sendRejectionEmail(to, fullName, adminNote) {
  const name = fullName || "bạn";
  const t = getTransporter();

  if (!t) {
    console.log(`[EMAIL chưa cấu hình] Thông báo từ chối cho ${to} | Lý do: ${adminNote}`);
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h1 style="color: #ef4444; text-align: center; margin-bottom: 24px;">PHOTOHUB</h1>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Chúng tôi rất tiếc phải thông báo rằng hồ sơ đăng ký hoạt động nhiếp ảnh gia của bạn chưa được phê duyệt.</p>
      <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #ef4444; margin: 16px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <p style="margin: 0; font-weight: bold; color: #4b5563;">Lý do từ chối:</p>
        <p style="margin: 8px 0 0 0; color: #1f2937; font-style: italic;">${adminNote || "Không cung cấp lý do cụ thể"}</p>
      </div>
      <p>Vui lòng đăng nhập vào tài khoản của bạn, cập nhật lại thông tin/hình ảnh giấy tờ cần thiết và gửi lại yêu cầu xác minh.</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:4200"}" style="background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Cập nhật hồ sơ của bạn</a>
      </div>
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">Trân trọng,<br>Đội ngũ PhotoHub</p>
    </div>
  `;

  await t.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || "PHOTOHUB"}" <${process.env.MAIL_USER}>`,
    to,
    subject: "Yêu cầu xác minh nhiếp ảnh gia bị từ chối - PHOTOHUB",
    text: `Rất tiếc! Hồ sơ đối tác của bạn chưa được phê duyệt. Lý do: ${adminNote || "Không cung cấp lý do cụ thể"}`,
    html: htmlContent,
  });
  console.log(`[EMAIL] Đã gửi email thông báo từ chối tới ${to}`);
}

module.exports = { sendVerifyEmailOtp, sendApprovalEmail, sendRejectionEmail, hasMailConfig };

