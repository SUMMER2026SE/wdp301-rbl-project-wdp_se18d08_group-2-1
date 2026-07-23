import axios from "axios";

const API_BASE = "https://photo-hub-be-project.vercel.app/api/assistant";

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
