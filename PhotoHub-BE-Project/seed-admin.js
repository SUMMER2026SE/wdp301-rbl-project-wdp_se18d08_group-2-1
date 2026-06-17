const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { User } = require("./src/modules/auth/models/User");
const MONGO_URI = process.env.MONGO_URI;

async function seedAdmin() {
  if (!MONGO_URI) {
    console.error("❌ Lỗi: MONGO_URI không được tìm thấy trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công");

    const adminEmail = "lebaochau1704@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️ Tài khoản Admin (${adminEmail}) đã tồn tại trên hệ thống.`);
      // Đảm bảo role đúng là admin
      existingAdmin.role = "admin";
      existingAdmin.isVerified = true;
      existingAdmin.isBlocked = false;
      await existingAdmin.save();
      console.log("✅ Đã đảm bảo vai trò của tài khoản này là 'admin'.");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        fullName: "System Administrator",
        isVerified: true,
        isBlocked: false,
      });

      console.log("=========================================");
      console.log("🎉 TẠO TÀI KHOẢN ADMIN THÀNH CÔNG!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log("🔑 Mật khẩu: admin123");
      console.log("=========================================");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo Admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
    process.exit(0);
  }
}

seedAdmin();
