const BASE_URL = "https://photo-hub-be-project.vercel.app/api/auth";

export const profileService = {

    // GET PROFILE
    getProfile: async () => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/profile`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return response.json();
    },

    // UPDATE PROFILE
    updateProfile: async (data) => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        return response.json();
    },

    // UPLOAD AVATAR
    uploadAvatar: async (file) => {
        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch(`${BASE_URL}/profile/avatar`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        return response.json();
    },

    // CHANGE PASSWORD
    changePassword: async (data) => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        return response.json();
    },
};