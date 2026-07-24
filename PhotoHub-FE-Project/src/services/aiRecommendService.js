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
  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tìm kiếm nhiếp ảnh gia dựa trên ảnh tham chiếu
   */
  searchByImage: async (imageFile, maxBudget = null, limit = 5) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (maxBudget !== null && maxBudget !== undefined && maxBudget !== "") {
      formData.append("maxBudget", maxBudget);
    }
    formData.append("limit", limit);
    const config = getAuthConfig(true);
    const response = await axios.post(`${BASE_URL}/airecommend/search`, formData, config);
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ALBUM APIs (MỚI)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tạo album mới
   * @param {FormData} formData - title, description, price_package, category, styleTags[], isPublic, coverImage (file)
   */
  createAlbum: async (formData) => {
    const response = await axios.post(
      `${BASE_URL}/airecommend/portfolio/album`,
      formData,
      getAuthConfig(true)
    );
    return response.data;
  },

  /**
   * Upload ảnh vào album (sinh AI embedding)
   * @param {string} albumId
   * @param {File} imageFile
   * @param {string} caption
   */
  uploadImageToAlbum: async (albumId, imageFile, caption = "") => {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (caption) formData.append("caption", caption);
    const response = await axios.post(
      `${BASE_URL}/airecommend/portfolio/album/${albumId}/image`,
      formData,
      getAuthConfig(true)
    );
    return response.data;
  },

  /**
   * Lấy danh sách albums của một photographer
   * @param {string} photographerId
   */
  getAlbumsByPhotographer: async (photographerId, page = 1, limit = 20) => {
    const response = await axios.get(
      `${BASE_URL}/airecommend/portfolio/photographer/${photographerId}/albums?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Lấy chi tiết 1 album + tất cả ảnh trong album
   * @param {string} albumId
   */
  getAlbumDetail: async (albumId) => {
    const response = await axios.get(
      `${BASE_URL}/airecommend/portfolio/album/${albumId}`
    );
    return response.data;
  },

  /**
   * Xóa album và toàn bộ ảnh trong album
   * @param {string} albumId
   */
  deleteAlbum: async (albumId) => {
    const response = await axios.delete(
      `${BASE_URL}/airecommend/portfolio/album/${albumId}`,
      getAuthConfig()
    );
    return response.data;
  },

  /**
   * Xóa 1 ảnh khỏi album
   * @param {string} imageId
   */
  deletePortfolioImage: async (imageId) => {
    const response = await axios.delete(
      `${BASE_URL}/airecommend/portfolio/image/${imageId}`,
      getAuthConfig()
    );
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMON APIs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách danh mục chụp ảnh
   */
  getCategories: async () => {
    const response = await axios.get(`${BASE_URL}/shooting-categories`);
    return response.data;
  },

  /**
   * Lấy danh sách thẻ phong cách
   */
  getStyleTags: async () => {
    const response = await axios.get(`${BASE_URL}/style-tags`);
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEGACY APIs (giữ lại để backward compatible)
  // ─────────────────────────────────────────────────────────────────────────

  /** @deprecated Dùng createAlbum + uploadImageToAlbum thay thế */
  uploadPortfolioItem: async (imageFile, pricePackage, caption = "") => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("price_package", pricePackage);
    formData.append("caption", caption);
    const config = getAuthConfig(true);
    const response = await axios.post(`${BASE_URL}/airecommend/portfolio/upload`, formData, config);
    return response.data;
  },

  /** @deprecated Dùng getAlbumsByPhotographer thay thế */
  getPortfolios: async (photographerId, page = 1, limit = 20) => {
    const response = await axios.get(
      `${BASE_URL}/airecommend/portfolio/photographer/${photographerId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

export default aiRecommendService;
