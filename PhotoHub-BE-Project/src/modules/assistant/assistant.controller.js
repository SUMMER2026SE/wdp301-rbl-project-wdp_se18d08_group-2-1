const ApiResponse = require("../../utils/ApiResponse");
const { chatWithGroq } = require("../airecomment/services/aiService");

const SYSTEM_PROMPTS = {
  vi: {
    guest:
      "Bạn là trợ lý PhotoHub. Hãy trả lời ngắn gọn, rõ ràng, thân thiện. PhotoHub là nền tảng nhiếp ảnh gồm photographer, booking, gói tháng, cộng đồng, thanh toán, chat realtime và album giao ảnh. Nếu người dùng hỏi thao tác, hãy chỉ đúng trang hoặc luồng phù hợp. Không bịa tính năng không có trong hệ thống.",
    customer:
      "Bạn là trợ lý PhotoHub cho khách hàng. Hãy ưu tiên hướng dẫn đặt lịch, thanh toán, xem booking, gói tháng theo photographer, cộng đồng, chat với photographer và album giao ảnh. Trả lời ngắn gọn, thực dụng, bằng tiếng Việt tự nhiên. Nếu thiếu dữ liệu cụ thể thì nói rõ và gợi ý đường đi trong app.",
    photographer:
      "Bạn là trợ lý PhotoHub cho photographer. Hãy ưu tiên hướng dẫn quản lý hồ sơ, package, gói tháng, booking, chat với customer, album, doanh thu, rút tiền và cộng đồng. Trả lời ngắn gọn, thực dụng, bằng tiếng Việt tự nhiên. Nếu thiếu dữ liệu cụ thể thì nói rõ và gợi ý đường đi trong app.",
  },
  en: {
    guest:
      "You are the PhotoHub assistant. Answer concisely and clearly. PhotoHub is a photography platform with photographers, booking, monthly subscription plans, community, payments, realtime chat, and final album delivery. When users ask for actions, point them to the right page or workflow. Do not invent features that do not exist.",
    customer:
      "You are the PhotoHub assistant for customers. Prioritize booking, payment, booking history, photographer-specific monthly plans, community, photographer chat, and album delivery. Answer concisely and practically in natural English. If you lack exact data, say so and guide the user through the app.",
    photographer:
      "You are the PhotoHub assistant for photographers. Prioritize profile management, packages, monthly plans, bookings, customer chat, albums, revenue, withdrawals, and community workflows. Answer concisely and practically in natural English. If you lack exact data, say so and guide the user through the app.",
  },
};

function pickPrompt(language, role) {
  const lang = language === "en" ? "en" : "vi";
  const safeRole = ["customer", "photographer"].includes(role) ? role : "guest";
  return SYSTEM_PROMPTS[lang][safeRole];
}

function normalizeMessages(messages = []) {
  return messages
    .filter((message) => message && typeof message.content === "string" && message.content.trim())
    .map((message) => ({
      role: ["user", "assistant"].includes(message.role) ? message.role : "user",
      content: message.content.trim(),
    }))
    .slice(-12);
}

class AssistantController {
  async chat(req, res) {
    try {
      const { messages = [], language = "vi", role = "guest", page = "home" } = req.body || {};

      const conversation = normalizeMessages(messages);
      if (conversation.length === 0) {
        return ApiResponse.error(res, "Messages are required", 400);
      }

      const systemPrompt = `${pickPrompt(language, role)} The current context is: ${page}.`;
      const result = await chatWithGroq({
        messages: conversation,
        systemPrompt,
        temperature: 0.45,
        maxTokens: 700,
      });

      return ApiResponse.success(
        res,
        {
          reply: result.reply,
          model: result.model,
        },
        "Assistant reply generated"
      );
    } catch (error) {
      console.error("[Assistant] chat:", error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new AssistantController();
