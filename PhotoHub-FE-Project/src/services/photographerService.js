import axios from "axios";

const BASE_URL = "http://localhost:3000/api/photographers";
const MARKETPLACE_BASE_URL = "http://localhost:3000/api/photographer";

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

        const response = await fetch(`${BASE_URL}/me/profile`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Lỗi hệ thống: ${response.status}`);
        }

        return response.json();
    },
};

const getAuthConfig = (isMultipart = false) => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": isMultipart ? "multipart/form-data" : "application/json",
        },
    };
};

export const photographerMarketplaceService = {
    // --- BOOKINGS ---
    rejectBooking: async (bookingId, reason) => {
        const response = await axios.put(
            `${MARKETPLACE_BASE_URL}/bookings/${bookingId}/reject`,
            { reason },
            getAuthConfig()
        );
        return response.data;
    },
};
