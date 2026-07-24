import axios from "axios";

const API_BASE = "http://localhost:3000/api/assistant";

export const aiAssistantService = {
  chat: async ({ messages, language = "vi", role = "guest", page = "home" }) => {
    const res = await axios.post(`${API_BASE}/chat`, {
      messages,
      language,
      role,
      page,
    });
    return res.data;
  },
};
