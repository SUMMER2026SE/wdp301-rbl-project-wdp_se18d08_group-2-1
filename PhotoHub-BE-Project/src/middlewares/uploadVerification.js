const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Thêm thư viện fs để kiểm tra/tạo thư mục

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // __dirname là thư mục chứa file config này. 
    // Thường file config nằm trong src/config/ hoặc src/middlewares/. 
    // Bạn dùng path.join kết hợp với 'src' hoặc đi từ thư mục gốc.
    
    // Cách an toàn nhất khi dùng với cấu trúc của bạn (nối thẳng vào thư mục dự án /src/uploads):
    // Giả sử file này đang nằm ở src/middlewares/upload.js (lùi 2 cấp ra ngoài rồi vào src/uploads)
    const dir = path.join(__dirname, "..", "..", "src", "uploads", "photographer-verifications");
    
    // HOẶC nếu file config này đang ở ngang hàng với src (ngay ngoài project root), dùng dòng dưới:
    // const dir = path.join(__dirname, "src", "uploads", "photographer-verifications");

    // Tự động tạo thư mục nếu chưa có
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

module.exports = multer({ storage });