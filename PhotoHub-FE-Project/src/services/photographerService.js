const BASE_URL = "http://localhost:3000/api/photographers";

export const photographerService = {

    // SEARCH PHOTOGRAPHERS
    searchPhotographers: async (queryParams = {}) => {
        const query = new URLSearchParams(queryParams).toString();

        const response = await fetch(`${BASE_URL}/search?${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // LIST PHOTOGRAPHERS
    listPhotographers: async (queryParams = {}) => {
        const query = new URLSearchParams(queryParams).toString();

        const response = await fetch(`${BASE_URL}?${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // GET PHOTOGRAPHER DETAIL
    getPhotographerDetail: async (id) => {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // GET TOP PHOTOGRAPHERS
    getTopPhotographers: async (limit = 5) => {
        const response = await fetch(`${BASE_URL}/top?limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // GET ALL STYLES
    getStyles: async () => {
        const response = await fetch(`${BASE_URL}/styles`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // GET ALL LOCATIONS
    getLocations: async () => {
        const response = await fetch(`${BASE_URL}/locations`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    },

    // CREATE PHOTOGRAPHER PROFILE
    createPhotographerProfile: async (data) => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        return response.json();
    },

    // UPDATE PHOTOGRAPHER PROFILE
    updatePhotographerProfile: async (id, data) => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        return response.json();
    },

    // GET MY PHOTOGRAPHER PROFILE
    getMyPhotographerProfile: async () => {
        const token = localStorage.getItem("token");

        // Chỉ gửi Authorization Header, loại bỏ hoàn toàn Content-Type
        const response = await fetch(`${BASE_URL}/me/profile`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Thêm kiểm tra nếu response không ok thì quăng lỗi ra để catch xử lý
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Lỗi hệ thống: ${response.status}`);
        }

        return response.json();
    },
};