const mongoose = require("mongoose");
const FavoritePhotographer = require("../models/favoritePhotographe");
const Customer = require("../../customers/models/customer");
const Photographer = require("../../photographers/models/photographer");
const { User } = require("../../auth/models/User");

class FavoritePhotographerService {
  // 1. Thêm nhiếp ảnh gia vào danh sách yêu thích
  async addFavorite(userId, photographerId) {
    // Kiểm tra nhiếp ảnh gia có tồn tại không
    const photographer = await Photographer.findById(photographerId);
    if (!photographer) {
      throw new Error("Không tìm thấy thông tin nhiếp ảnh gia.");
    }

    // Tìm hồ sơ Customer liên kết với User, nếu chưa có thì tự động tạo
    let customer = await Customer.findOne({ user: userId });
    if (!customer) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Không tìm thấy tài khoản người dùng.");
      }
      customer = await Customer.create({
        UUID: user.UUID || new mongoose.Types.ObjectId().toString(),
        user: userId,
        preferredStyles: [],
        preferredLocation: "",
      });
    }

    // Kiểm tra xem đã yêu thích nhiếp ảnh gia này chưa
    const existingFavorite = await FavoritePhotographer.findOne({
      customer: customer._id,
      photographer: photographerId,
    });

    if (existingFavorite) {
      throw new Error("Nhiếp ảnh gia này đã có trong danh sách yêu thích.");
    }

    // Tạo bản ghi yêu thích mới
    const newFavorite = await FavoritePhotographer.create({
      UUID: new mongoose.Types.ObjectId().toString(),
      customer: customer._id,
      photographer: photographerId,
    });

    return newFavorite;
  }

  // 2. Xóa nhiếp ảnh gia khỏi danh sách yêu thích
  async removeFavorite(userId, photographerId) {
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      throw new Error("Không tìm thấy hồ sơ khách hàng.");
    }

    const favorite = await FavoritePhotographer.findOneAndDelete({
      customer: customer._id,
      photographer: photographerId,
    });

    if (!favorite) {
      throw new Error("Nhiếp ảnh gia này chưa nằm trong danh sách yêu thích.");
    }

    return { message: "Đã xóa khỏi danh sách yêu thích thành công." };
  }

  // 3. Lấy toàn bộ danh sách yêu thích của người dùng hiện tại
  async getFavorites(userId) {
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return [];
    }

    // Tìm các bản ghi yêu thích và populate thông tin photographer kèm thông tin User của họ
    const favorites = await FavoritePhotographer.find({ customer: customer._id })
      .populate({
        path: "photographer",
        populate: {
          path: "user",
          select: "fullName email avatar phoneNumber",
        },
      });

    return favorites;
  }

  // 4. Kiểm tra xem photographer cụ thể đã được yêu thích chưa
  async checkFavoriteStatus(userId, photographerId) {
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return { isFavorited: false };
    }

    const favorite = await FavoritePhotographer.findOne({
      customer: customer._id,
      photographer: photographerId,
    });

    return { isFavorited: !!favorite };
  }
}

module.exports = new FavoritePhotographerService();
