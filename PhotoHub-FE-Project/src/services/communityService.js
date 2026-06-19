import axios from "axios";

const COMMUNITY_BASE_URL = "http://localhost:3000/api/community";
const PHOTOGRAPHER_CHAT_BASE_URL = "http://localhost:3000/api/photographer/chat";

const getAuthConfig = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token || token === "undefined" || token === "null") return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const communityService = {
  getPosts: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== "" && value !== false && value !== null && value !== undefined)
    );
    const response = await axios.get(`${COMMUNITY_BASE_URL}/posts`, { params: cleanParams, ...getAuthConfig() });
    return response.data;
  },

  getPost: async (id) => {
    const response = await axios.get(`${COMMUNITY_BASE_URL}/posts/${id}`, getAuthConfig());
    return response.data;
  },

  createPost: async (payload) => {
    const response = await axios.post(`${COMMUNITY_BASE_URL}/posts`, payload, getAuthConfig());
    return response.data;
  },

  toggleLike: async (id) => {
    const response = await axios.post(`${COMMUNITY_BASE_URL}/posts/${id}/like`, {}, getAuthConfig());
    return response.data;
  },

  toggleSave: async (id) => {
    const response = await axios.post(`${COMMUNITY_BASE_URL}/posts/${id}/save`, {}, getAuthConfig());
    return response.data;
  },

  addComment: async (id, content, parentComment = null) => {
    const response = await axios.post(`${COMMUNITY_BASE_URL}/posts/${id}/comments`, { content, parentComment }, getAuthConfig());
    return response.data;
  },

  getChatConversations: async () => {
    const response = await axios.get(`${PHOTOGRAPHER_CHAT_BASE_URL}/conversations`, getAuthConfig());
    return response.data;
  },

  sharePostToConversation: async (conversationId, post) => {
    const postUrl = `${window.location.origin}/community?post=${post._id}`;
    const response = await axios.post(
      `${PHOTOGRAPHER_CHAT_BASE_URL}/messages/${conversationId}`,
      {
        text: `PhotoHub Community: ${post.title}\n${postUrl}`,
        messageType: "text",
        metadata: {
          type: "community_post",
          postId: post._id,
          title: post.title,
          coverImage: post.coverImage || "",
          category: post.category || "discussion",
          url: postUrl,
        },
      },
      getAuthConfig()
    );
    return response.data;
  },

  deletePost: async (id) => {
    const response = await axios.delete(`${COMMUNITY_BASE_URL}/posts/${id}`, getAuthConfig());
    return response.data;
  },
};
