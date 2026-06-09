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

    completeBooking: async (bookingId) => {
        const response = await axios.put(
            `${MARKETPLACE_BASE_URL}/bookings/${bookingId}/complete`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    // --- CALENDAR ---
    getCalendar: async (params = {}) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/calendar`, {
            ...getAuthConfig(),
            params,
        });
        return response.data;
    },

    // --- JOB POSTS ---
    getJobPosts: async (params = {}) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/jobs`, {
            ...getAuthConfig(),
            params,
        });
        return response.data;
    },

    getJobDetail: async (id) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/jobs/${id}`, getAuthConfig());
        return response.data;
    },

    // --- RECOMMENDATIONS ---
    getRecommendations: async () => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/jobs/recommended`, getAuthConfig());
        return response.data;
    },

    // --- BIDS ---
    submitBid: async (bidData) => {
        const response = await axios.post(`${MARKETPLACE_BASE_URL}/bids`, bidData, getAuthConfig());
        return response.data;
    },

    updateBid: async (bidId, bidData) => {
        const response = await axios.put(`${MARKETPLACE_BASE_URL}/bids/${bidId}`, bidData, getAuthConfig());
        return response.data;
    },

    getMyBids: async () => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/bids`, getAuthConfig());
        return response.data;
    },

    // --- CHAT ---
    getConversations: async () => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/chat/conversations`, getAuthConfig());
        return response.data;
    },

    getMessages: async (conversationId) => {
        const response = await axios.get(
            `${MARKETPLACE_BASE_URL}/chat/messages/${conversationId}`,
            getAuthConfig()
        );
        return response.data;
    },

    createConversation: async (recipientId, bookingId = null, jobPostId = null) => {
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/chat/conversations`,
            { recipientId, bookingId, jobPostId },
            getAuthConfig()
        );
        return response.data;
    },

    // --- ALBUM ---
    uploadAlbum: async (formData) => {
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/albums`,
            formData,
            getAuthConfig(true)
        );
        return response.data;
    },

    getAlbum: async (bookingId) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/albums/${bookingId}`, getAuthConfig());
        return response.data;
    },

    // --- REVENUE ---
    getRevenue: async () => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/revenue`, getAuthConfig());
        return response.data;
    },

    // --- WITHDRAW ---
    requestWithdraw: async (withdrawData) => {
        const response = await axios.post(`${MARKETPLACE_BASE_URL}/withdraw`, withdrawData, getAuthConfig());
        return response.data;
    },

    getWithdrawRequests: async () => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/withdraw`, getAuthConfig());
        return response.data;
    },
};
