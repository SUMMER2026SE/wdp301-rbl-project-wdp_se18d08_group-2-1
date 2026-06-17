import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const getAuthConfig = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": isMultipart ? "multipart/form-data" : "application/json",
    },
  };
};

export const aiRecommendService = {
  /**
   * Tìm kiếm nhiếp ảnh gia dựa trên ảnh tham chiếu
   * @param {File} imageFile - File ảnh mẫu
   * @param {number|null} maxBudget - Ngân sách tối đa (tùy chọn)
   * @param {number} limit - Số kết quả tối đa
   */
  searchByImage: async (imageFile, maxBudget = null, limit = 5) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (maxBudget !== null && maxBudget !== undefined && maxBudget !== "") {
      formData.append("maxBudget", maxBudget);
    }
    formData.append("limit", limit);

    // Không bắt buộc token nhưng đính kèm nếu có để backend nhận diện user nếu cần
    const config = getAuthConfig(true);
    const response = await axios.post(`${BASE_URL}/airecommend/search`, formData, config);
    return response.data;
  },

  /**
   * Đăng tải ảnh Portfolio (Nhiếp ảnh gia)
   * @param {File} imageFile - File ảnh
   * @param {number} pricePackage - Giá trị gói
   * @param {string} caption - Mô tả tác phẩm
   */
  uploadPortfolioItem: async (imageFile, pricePackage, caption = "") => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("price_package", pricePackage);
    formData.append("caption", caption);

    const config = getAuthConfig(true);
    const response = await axios.post(`${BASE_URL}/airecommend/portfolio/upload`, formData, config);
    return response.data;
  },

  /**
   * Lấy danh sách ảnh Portfolio của nhiếp ảnh gia
   * @param {string} photographerId - ID của nhiếp ảnh gia
   * @param {number} page
   * @param {number} limit
   */
  getPortfolios: async (photographerId, page = 1, limit = 20) => {
    const response = await axios.get(
      `${BASE_URL}/airecommend/portfolio/photographer/${photographerId}?page=${page}&limit=${limit}`,
      getAuthConfig()
    );
    return response.data;
  },
};

export default aiRecommendService;
