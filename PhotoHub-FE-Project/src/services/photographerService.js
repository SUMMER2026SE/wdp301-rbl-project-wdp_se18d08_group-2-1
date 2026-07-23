import axios from "axios";

const BASE_URL = "https://photo-hub-be-project.vercel.app/api/photographers";
const MARKETPLACE_BASE_URL = "https://photo-hub-be-project.vercel.app/api/photographer";
const BOOKING_BASE_URL = "https://photo-hub-be-project.vercel.app/api/bookings";

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
            throw new Error(errorData.message || "L\u1ed7i h\u1ec7 th\u1ed1ng: " + response.status);
        }

        return response.json();
    },
    // Upload CCCD xac minh
    uploadVerification: async (frontImage, backImage) => {
        const token = localStorage.getItem("token");

        const formData = new FormData();

        formData.append("frontImage", frontImage);

        if (backImage) {
            formData.append("backImage", backImage);
        }

        const response = await axios.post(
            `${BASE_URL}/me/verification`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    },

    // Kiểm tra trạng thái hồ sơ photographer
    getProfileStatus: async () => {
        const token = localStorage.getItem("token");

        const response = await axios.get(
            `${BASE_URL}/me/profile-status`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    getPhotographerByUserId: async (userId) => {
        const response = await axios.get(`${BASE_URL}/user/${userId}`);
        return response.data;
    },
};

const getAuthConfig = (isMultipart = false) => {
    const token = localStorage.getItem("token");
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    if (!isMultipart) {
        headers["Content-Type"] = "application/json";
    }

    return {
        headers,
    };
};

export const photographerMarketplaceService = {
    // --- BOOKINGS ---
    acceptBooking: async (bookingId) => {
        const response = await axios.put(
            `${BOOKING_BASE_URL}/${bookingId}/accept`,
            {},
            getAuthConfig()
        );
        return response.data;
    },
    rejectBooking: async (bookingId, reason) => {
        const response = await axios.put(
            `${BOOKING_BASE_URL}/${bookingId}/reject`,
            { reason },
            getAuthConfig()
        );
        return response.data;
    },

    completeBooking: async (bookingId) => {
        const response = await axios.put(
            `${BOOKING_BASE_URL}/${bookingId}/complete`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    approveCompletion: async (bookingId) => {
        const response = await axios.put(
            `${BOOKING_BASE_URL}/${bookingId}/approve`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    createBookingPaymentLink: async (bookingId) => {
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/bookings/${bookingId}/payment`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    syncBookingPaymentStatus: async (bookingId, orderCode) => {
        const response = await axios.get(
            `${MARKETPLACE_BASE_URL}/bookings/${bookingId}/payment/status`,
            {
                ...getAuthConfig(),
                params: { orderCode },
            }
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

    getPhotographerCalendar: async (photographerId, params = {}) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/calendar/photographer/${photographerId}`, {
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

    assistBid: async (jobPostId) => {
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/bids/assist`,
            { jobPostId },
            getAuthConfig()
        );
        return response.data;
    },

    optimizeBid: async (bidId) => {
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/bids/${bidId}/optimize`,
            {},
            getAuthConfig()
        );
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

    sendChatMessage: async (conversationId, messageData = {}) => {
        const { text = "", messageType = "text", attachments = [], metadata = {} } = messageData;
        const hasAttachments = attachments && attachments.length > 0;

        if (hasAttachments) {
            const formData = new FormData();
            formData.append("text", text);
            formData.append("messageType", messageType);
            formData.append("metadata", JSON.stringify(metadata));
            attachments.forEach((file) => formData.append("attachments", file));

            const response = await axios.post(
                `${MARKETPLACE_BASE_URL}/chat/messages/${conversationId}`,
                formData,
                getAuthConfig(true)
            );
            return response.data;
        }

        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/chat/messages/${conversationId}`,
            { text, messageType, metadata },
            getAuthConfig()
        );
        return response.data;
    },

    // --- ALBUM ---
    uploadAlbum: async (formData, onProgress) => {
        const config = getAuthConfig(true);
        // Timeout 10 phút cho album nhiều ảnh lớn
        config.timeout = 10 * 60 * 1000;
        if (typeof onProgress === "function") {
            config.onUploadProgress = (e) => {
                const pct = Math.round((e.loaded * 100) / e.total);
                onProgress(pct);
            };
        }
        const response = await axios.post(
            `${MARKETPLACE_BASE_URL}/albums`,
            formData,
            config
        );
        return response.data;
    },

    getAlbum: async (bookingId) => {
        const response = await axios.get(`${MARKETPLACE_BASE_URL}/albums/${bookingId}`, getAuthConfig());
        return response.data;
    },

    // --- REVENUE ---
    getRevenue: async (params = {}) => {
        const response = await axios.get(
            `${MARKETPLACE_BASE_URL}/revenue`,
            {
                ...getAuthConfig(),
                params,
            }
        );

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

