const { sendGmail } = require("./gmail.service");

function hasMailConfig() {
  return Boolean(
    process.env.GMAIL_USER &&
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
}

/**
 * Gửi OTP xác thực email
 */
async function sendVerifyEmailOtp(to, otp, fullName) {
  const name = fullName || "bạn";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;">
      <h1 style="color:#E50914;">PHOTOHUB</h1>

      <p>Xin chào <strong>${name}</strong>,</p>

      <p>Mã xác thực email của bạn là:</p>

      <p style="
          font-size:30px;
          font-weight:bold;
          letter-spacing:8px;
          color:#E50914;
      ">
          ${otp}
      </p>

      <p style="color:#666">
          Mã có hiệu lực trong <strong>15 phút</strong>.
      </p>

      <p style="color:#666">
          Không chia sẻ mã này cho bất kỳ ai.
      </p>
    </div>
  `;

  await sendGmail({
    to,
    subject: "Mã xác thực email - PHOTOHUB",
    text: `Mã OTP của bạn là ${otp}`,
    html: htmlContent,
  });

  console.log(`[EMAIL] Đã gửi OTP tới ${to}`);
}

/**
 * Gửi email phê duyệt photographer
 */
async function sendApprovalEmail(to, fullName, adminNote) {
  const name = fullName || "bạn";

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">

      <h1 style="color:#22c55e">PHOTOHUB</h1>

      <p>Xin chào <strong>${name}</strong>,</p>

      <p>
        Chúc mừng!
        Hồ sơ đăng ký Photographer của bạn đã được
        <strong>Admin phê duyệt.</strong>
      </p>

      <div style="
          background:#f8fafc;
          padding:16px;
          border-left:4px solid #22c55e;
          margin:18px 0;
      ">
          <strong>Ghi chú:</strong><br>
          ${adminNote || "Hồ sơ hợp lệ"}
      </div>

      <p>
        Bây giờ bạn đã có thể đăng dịch vụ và nhận booking.
      </p>

      <a
          href="${process.env.FRONTEND_URL}"
          style="
            display:inline-block;
            margin-top:20px;
            background:#22c55e;
            color:white;
            padding:12px 22px;
            text-decoration:none;
            border-radius:6px;
        "
      >
        Truy cập PhotoHub
      </a>

    </div>
  `;

  await sendGmail({
    to,
    subject: "Hồ sơ Photographer đã được phê duyệt - PHOTOHUB",
    text: `Chúc mừng! Hồ sơ của bạn đã được phê duyệt.`,
    html: htmlContent,
  });

  console.log(`[EMAIL] Đã gửi email phê duyệt tới ${to}`);
}

/**
 * Gửi email từ chối photographer
 */
async function sendRejectionEmail(to, fullName, adminNote) {
  const name = fullName || "bạn";

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">

      <h1 style="color:#ef4444">PHOTOHUB</h1>

      <p>Xin chào <strong>${name}</strong>,</p>

      <p>
        Rất tiếc,
        hồ sơ đăng ký Photographer của bạn
        <strong>chưa được phê duyệt.</strong>
      </p>

      <div style="
          background:#f8fafc;
          padding:16px;
          border-left:4px solid #ef4444;
          margin:18px 0;
      ">
          <strong>Lý do:</strong><br>
          ${adminNote || "Không có ghi chú"}
      </div>

      <p>
        Vui lòng cập nhật hồ sơ và gửi xác minh lại.
      </p>

      <a
          href="${process.env.FRONTEND_URL}"
          style="
            display:inline-block;
            margin-top:20px;
            background:#ef4444;
            color:white;
            padding:12px 22px;
            text-decoration:none;
            border-radius:6px;
        "
      >
        Cập nhật hồ sơ
      </a>

    </div>
  `;

  await sendGmail({
    to,
    subject: "Hồ sơ Photographer chưa được phê duyệt - PHOTOHUB",
    text: `Hồ sơ của bạn chưa được phê duyệt.`,
    html: htmlContent,
  });

  console.log(`[EMAIL] Đã gửi email từ chối tới ${to}`);
}

module.exports = {
  sendVerifyEmailOtp,
  sendApprovalEmail,
  sendRejectionEmail,
  hasMailConfig,
};