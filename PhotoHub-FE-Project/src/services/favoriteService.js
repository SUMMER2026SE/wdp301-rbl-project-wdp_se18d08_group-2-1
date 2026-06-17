const BASE_URL = "http://localhost:3000/api/favoritephotographers";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const favoriteService = {
  // Thêm vào yêu thích
  addFavorite: async (photographerId) => {
    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ photographerId }),
    });
    return response.json();
  },

  // Xóa khỏi yêu thích
  removeFavorite: async (photographerId) => {
    const response = await fetch(`${BASE_URL}/${photographerId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Lấy danh sách yêu thích
  getFavorites: async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Kiểm tra trạng thái yêu thích
  checkFavoriteStatus: async (photographerId) => {
    const response = await fetch(`${BASE_URL}/${photographerId}/status`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
