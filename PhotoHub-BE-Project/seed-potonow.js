const mongoose = require("mongoose");
require("dotenv").config();

const { User } = require("./src/modules/auth/models/User");
const BlogPost = require("./src/modules/blog/models/BlogPost");
const MarketingEvent = require("./src/modules/events/models/MarketingEvent");

const MONGO_URI = process.env.MONGO_URI;

async function seedPotonow() {
  if (!MONGO_URI) {
    console.error("❌ Lỗi: MONGO_URI không được tìm thấy trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công");

    // 1. Tìm hoặc tạo tác giả (chọn admin hoặc user bất kỳ)
    let author = await User.findOne({ role: "admin" });
    if (!author) {
      author = await User.findOne({});
    }

    if (!author) {
      console.log("⚠️ Không tìm thấy người dùng nào trong DB để làm tác giả Blog. Đang tạo tạm một tài khoản...");
      author = await User.create({
        email: "author.potonow@example.com",
        fullName: "Potonow Editor",
        role: "admin",
        isVerified: true,
      });
    }

    console.log(`✍️ Sử dụng tác giả Blog: ${author.fullName} (${author.email})`);

    // 2. Seed Blog Posts
    await BlogPost.deleteMany({});
    console.log("🗑 Đã xóa các bài Blog cũ");

    const blogsData = [
      {
        title: "5 Bí quyết chụp ảnh cưới ngoài trời tự nhiên nhất",
        content: `Chụp ảnh cưới ngoại cảnh luôn mang lại những bức ảnh đầy sức sống và tự nhiên. Tuy nhiên, để có được một bộ ảnh cưới ngoài trời hoàn hảo, cô dâu chú rể cần lưu ý những điểm sau đây:
        1. Lựa chọn thời gian vàng (Golden Hour): Khoảng thời gian từ 16:30 - 17:30 chiều hoặc sớm bình minh là lúc ánh sáng mặt trời dịu và ấm áp nhất.
        2. Trang phục thoải mái: Tránh các bộ váy quá cồng kềnh, ưu tiên các chất liệu nhẹ nhàng bay bổng như voan, lụa.
        3. Tương tác tự nhiên: Hãy quên đi ống kính máy ảnh, hãy trò chuyện, trêu đùa và nhìn nhau một cách tình cảm nhất. Nhiếp ảnh gia sẽ nắm bắt những khoảnh khắc tự nhiên đó.`,
        author: author._id,
        coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
        tags: ["wedding", "outdoor", "tips"],
        likesCount: 124,
      },
      {
        title: "Nên chọn Studio hay chụp ngoại cảnh cho bộ ảnh kỷ yếu?",
        content: `Mỗi mùa tốt nghiệp đến, câu hỏi lớn nhất của các bạn học sinh sinh viên luôn là: Nên chụp kỷ yếu ở Studio hay đi ngoại cảnh?
        - Chụp Studio: Ưu điểm là chủ động thời gian, không lo thời tiết (mưa, nắng), ánh sáng được thiết lập hoàn hảo. Phù hợp với các bộ ảnh kỷ yếu trang nghiêm, tối giản hoặc concept hàn quốc nhẹ nhàng.
        - Chụp Ngoài trời: Phù hợp với các tập thể năng động, muốn kết hợp đi dã ngoại. Không gian rộng lớn giúp các bạn thoải mái chạy nhảy, ném bột màu và tạo các dáng tập thể hoành tráng.`,
        author: author._id,
        coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        tags: ["ky-yeu", "studio", "outdoor"],
        likesCount: 89,
      },
      {
        title: "Đánh giá ống kính chân dung giá rẻ tốt nhất 2026: 50mm f/1.8",
        content: `Nếu bạn mới bước chân vào con đường nhiếp ảnh và muốn chụp ảnh xóa phông ảo diệu cho người thân, bạn bè thì ống kính 50mm f/1.8 (hay còn gọi là ống kính 'nifty fifty') là lựa chọn không thể bỏ qua.
        Tại sao nó lại hot đến vậy?
        1. Khẩu độ lớn f/1.8 giúp thu sáng tốt trong điều kiện tối và tạo ra phần phông nền mờ mịn màng (bokeh đẹp).
        2. Tiêu cự 50mm trên cảm biến Full Frame cho góc nhìn rất tự nhiên, gần giống mắt người nhất.
        3. Mức giá cực kỳ sinh viên so với các ống kính cao cấp khác.`,
        author: author._id,
        coverImage: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80",
        tags: ["gear", "tips"],
        likesCount: 205,
      }
    ];

    await BlogPost.insertMany(blogsData);
    console.log("✅ Seed thành công các bài viết Blog mẫu");

    // 3. Seed Marketing Events
    await MarketingEvent.deleteMany({});
    console.log("🗑 Đã xóa các Sự kiện cũ");

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    const prevMonth = new Date();
    prevMonth.setMonth(now.getMonth() - 1);

    const eventsData = [
      {
        title: "Summer In Frame 2026: Lưu giữ mùa hè rực rỡ",
        description: "Chiến dịch chụp ảnh dã ngoại mùa hè lớn nhất năm do PhotoHub tổ chức. Giảm ngay 15% phí dịch vụ đi kèm bao gồm Makeup và trang phục mùa hè khi đặt lịch các nhiếp ảnh gia thuộc nhóm Elite Pro.",
        banner: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        startDate: now,
        endDate: nextMonth,
        status: "active",
        location: "Đà Nẵng & Nha Trang",
      },
      {
        title: "Tết Ơi Tết À: Concept Áo dài truyền thống",
        description: "Chào đón xuân mới với bộ ảnh áo dài cổ truyền độc đáo. Hỗ trợ trọn gói thuê trang phục áo dài xưa và trang điểm miễn phí tại các studio đối tác liên kết với PhotoHub tại Hà Nội và TP.HCM.",
        banner: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80",
        startDate: prevMonth,
        endDate: now, // Kết thúc hôm nay
        status: "ended",
        location: "Hà Nội, Sài Gòn",
      },
      {
        title: "Hanoi In Focus: Góc phố mùa thu lá rụng",
        description: "Khám phá vẻ đẹp nên thơ của Hà Nội những ngày thu về. Tham gia tour chụp ảnh đường phố (Streetlife) miễn phí cùng các nhiếp ảnh gia nổi tiếng và chia sẻ tác phẩm lên diễn đàn PhotoHub để nhận voucher trị giá 1.000.000đ.",
        banner: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
        startDate: now,
        endDate: nextMonth,
        status: "active",
        location: "Hồ Gươm & Phố Cổ Hà Nội",
      }
    ];

    await MarketingEvent.insertMany(eventsData);
    console.log("✅ Seed thành công các Sự kiện/Chiến dịch mẫu");

  } catch (error) {
    console.error("❌ Lỗi khi chạy Seeder:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
    process.exit(0);
  }
}

seedPotonow();
