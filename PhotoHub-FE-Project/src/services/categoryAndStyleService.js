import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com/api";

export const getAllCategories = async () => {
    try {
        // Ví dụ dùng axios, nếu dùng fetch thì chuyển đổi tương ứng
        const response = await axios.get(`${BASE_URL}/shooting-categories`);
        return response; // Trả về response chứa danh sách active categories
    } catch (error) {
        throw new Error(error.response?.data?.message || "Không thể lấy danh sách danh mục");
    }
};

export const getAllStyleTags = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/style-tags`);
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Không thể lấy danh sách phong cách");
    }
};