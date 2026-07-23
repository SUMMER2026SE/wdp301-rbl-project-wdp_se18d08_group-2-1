import axios from "axios";

const API_BASE = "https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com/api/assistant";

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
