// auth.service.js
const { User, UserRole } = require("../models/User");
const Photographer = require("../../photographers/models/Photographer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendVerifyEmailOtp } = require("../../../utils/emailService");
const { sendResetPasswordEmail } = require("../../../services/EmailService");

const JWT_SECRET = process.env.JWT_SECRET || "cinema_secret";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";


/** Tìm user theo email (chuẩn hóa + fallback không phân biệt hoa thụ trong DB cũ) */
async function findUserByEmail(emailNorm) {
  if (!emailNorm) return null;
  let u = await User.findOne({ email: emailNorm });
  if (u) return u;
  try {
    u = await User.findOne({
      $expr: {
        $eq: [{ $toLower: { $trim: { input: "$email" } } }, emailNorm],
      },
    });
  } catch {
    // Mongo cũ không hỗ trợ $expr
  }
  return u;
}

function queueOtpEmail(to, otp, fullName) {
  sendVerifyEmailOtp(to, otp, fullName).catch((err) =>
    console.error(`[EMAIL] Gửi OTP thất bại (${to}):`, err.message)
  );
}

class AuthService {
  async register(data) {
    const email = data.email;
    const role = data.role || UserRole.CUSTOMER; // Mặc định là customer nếu không truyền

    // Kiểm tra role hợp lệ
    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Vai trò đăng ký không hợp lệ.");
    }

    const existing = await User.findOne({ email }); // Đảm bảo hàm findUserByEmail của bạn chạy đúng
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyEmailExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (existing) {
      if (existing.isVerified) {
        throw new Error("Email đã được đăng ký. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.");
      }

      // Đã đăng ký nhưng chưa xác thực — cập nhật thông tin mới
      existing.password = hashedPassword;
      if (data.fullName) existing.fullName = data.fullName;
      existing.role = role; // Cập nhật lại role nếu họ muốn đổi lúc đăng ký lại
      existing.verifyEmailOTP = otp;
      existing.verifyEmailExpires = verifyEmailExpires;
      await existing.save();

      // Kiểm tra xem đã có bản ghi Photographer chưa, nếu chọn role photographer mà chưa có thì tạo mới
      if (role === UserRole.PHOTOGRAPHER) {
        const photoExist = await Photographer.findOne({ user: existing._id });
        if (!photoExist) {
          await Photographer.create({
            UUID: existing.UUID, // Dùng chung UUID từ User để đồng bộ dữ liệu nhanh
            user: existing._id,
            displayName: existing.fullName || "Nhiếp ảnh gia mới",
          });
        }
      }

      console.log(`[REGISTER] Gửi lại OTP (chưa verify): ${email} | OTP: ${otp}`);
      queueOtpEmail(email, otp, existing.fullName);

      return {
        message: "Đã cập nhật thông tin và gửi lại mã OTP. Vui lòng kiểm tra email.",
        email,
      };
    }

    // Tạo mới hoàn toàn User
    const newUser = await User.create({
      email,
      password: hashedPassword,
      fullName: data.fullName,
      role,
      isVerified: false,
      verifyEmailOTP: otp,
      verifyEmailExpires,
    });

    // Nếu đăng ký với tư cách Photographer -> Tạo profile Photographer tương ứng
    if (role === UserRole.PHOTOGRAPHER) {
      await Photographer.create({
        UUID: newUser.UUID, // Đồng bộ UUID từ hàm default sinh ra bên User
        user: newUser._id,
        displayName: data.fullName || "Nhiếp ảnh gia mới",
        experienceYears: 0,
        completionStatus: "PENDING"
      });
    }

    console.log(`[REGISTER] User mới [${role}]: ${email} | OTP: ${otp}`);
    queueOtpEmail(email, otp, data.fullName);

    return {
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
      email,
    };
  }

  async verifyEmail(data) {
    const user = await findUserByEmail(data.email);
    if (!user) throw new Error("Người dùng không tồn tại");

    if (user.isVerified) {
      return { message: "Tài khoản đã được xác thực trước đó." };
    }

    if (
      user.verifyEmailOTP !== data.otp ||
      !user.verifyEmailExpires ||
      user.verifyEmailExpires < new Date()
    ) {
      throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn.");
    }

    user.isVerified = true;
    user.verifyEmailOTP = undefined;
    user.verifyEmailExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const userObj = user.toObject();
    delete userObj.password;

    return {
      message: "Xác thực email thành công! Bạn có thể đăng nhập ngay.",
      user: userObj,
      accessToken: token,
    };
  }

  async resendVerifyEmail(email) {
    const user = await findUserByEmail(email);
    if (!user) throw new Error("Người dùng không tồn tại");

    if (user.isVerified) {
      return { message: "Tài khoản đã được xác thực trước đó." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyEmailOTP = otp;
    user.verifyEmailExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    console.log(`[RESEND OTP] ${email} | OTP: ${otp}`);
    queueOtpEmail(email, otp, user.fullName);

    return { message: "Mã OTP mới đã được gửi tới email của bạn." };
  }

  async login(data) {

    console.log("=== LOGIN SERVICE ===");

    const user = await findUserByEmail(data.email);

    console.log("FOUND USER:", user);

    if (!user) {
      console.log("KHÔNG TÌM THẤY USER");
      throw new Error("Thông tin đăng nhập không hợp lệ");
    }

    console.log("isVerified:", user.isVerified);

    if (!user.isVerified) {
      console.log("CHƯA VERIFY");
      throw new Error(
        "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để nhận mã OTP xác thực."
      );
    }

    console.log("INPUT PASSWORD:", data.password);
    console.log("HASH:", user.password);

    const isMatch = await bcrypt.compare(
      data.password,
      user.password
    );

    console.log("MATCH:", isMatch);

    if (!isMatch) {
      throw new Error("Thông tin đăng nhập không hợp lệ");
    }

    if (user.isBlocked) {
      throw new Error(
        "Tài khoản đã bị khóa."
      );
    }

    console.log("LOGIN SUCCESS");

    // tạo JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRE,
      }
    );

    // convert object
    const userObj = user.toObject();

    // xóa dữ liệu nhạy cảm
    delete userObj.password;
    delete userObj.passwordPlainForAdmin;

    // return đúng
    return {
      user: userObj,
      token,
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Người dùng không tồn tại");

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    user.resetPasswordOTP = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await user.save();

    await sendResetPasswordEmail(email, resetToken);
    return { message: "OTP đang được gửi tới bạn" };
  }

  async resetPassword(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) throw new Error("Người dùng không tồn tại");

    if (
      user.resetPasswordOTP !== data.token ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new Error("OTP không hợp lệ hoặc đã hết hạn");
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: "Mật khẩu đã được cập nhật" };
  }
}

module.exports = AuthService;