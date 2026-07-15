import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import Swal from "sweetalert2";
import { aiAssistantService } from "../../services/aiAssistantService";

const storageKey = (language, role) => `photohub-ai-chat:${language}:${role}`;

function getUserRole() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "guest";
    const user = JSON.parse(raw);
    const role = String(user?.role || "").toLowerCase();
    if (role === "photographer") return "photographer";
    if (role === "customer") return "customer";
    return "guest";
  } catch (_error) {
    return "guest";
  }
}

function initialGreeting(language, role) {
  if (language === "en") {
    if (role === "photographer") {
      return "Hi, I can help with packages, bookings, albums, revenue, and customer chat.";
    }
    if (role === "customer") {
      return "Hi, I can help you choose photographers, book a shoot, understand payment, and view monthly plans.";
    }
    return "Hi, I am the PhotoHub assistant. Ask me anything about booking, packages, chat, or the community.";
  }

  if (role === "photographer") {
    return "Chào bạn, mình có thể hỗ trợ về package, booking, album, doanh thu và chat với khách hàng.";
  }
  if (role === "customer") {
    return "Chào bạn, mình có thể giúp chọn photographer, đặt lịch, thanh toán và xem gói tháng.";
  }
  return "Chào bạn, mình là trợ lý PhotoHub. Bạn cứ hỏi về booking, gói tháng, chat hoặc cộng đồng nhé.";
}

function quickPrompts(language, role) {
  if (language === "en") {
    if (role === "photographer") {
      return [
        "How do I create a monthly plan?",
        "How can I check revenue and payout?",
        "Where do I chat with customers?",
      ];
    }
    if (role === "customer") {
      return [
        "How do I book a photographer?",
        "How do monthly plans work?",
        "How do I check payment status?",
      ];
    }
    return [
      "What can PhotoHub help me with?",
      "How do I start booking?",
      "How do I use the community page?",
    ];
  }

  if (role === "photographer") {
    return [
      "Làm sao tạo gói tháng?",
      "Xem doanh thu và rút tiền ở đâu?",
      "Chat với khách hàng như thế nào?",
    ];
  }
  if (role === "customer") {
    return [
      "Làm sao đặt lịch với photographer?",
      "Gói tháng hoạt động thế nào?",
      "Kiểm tra trạng thái thanh toán ở đâu?",
    ];
  }
  return [
    "PhotoHub hỗ trợ gì cho tôi?",
    "Bắt đầu đặt lịch như thế nào?",
    "Cộng đồng hoạt động ra sao?",
  ];
}

export default function AIChatWidget({ language = "vi", theme = "light" }) {
  const isDark = theme === "dark";
  const bottomRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [role, setRole] = useState(() => getUserRole());
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey(language, getUserRole()));
      if (stored) return JSON.parse(stored);
    } catch (_error) {
      // ignore
    }
    return [
      {
        role: "assistant",
        content: initialGreeting(language, getUserRole()),
      },
    ];
  });

  const prompts = useMemo(() => quickPrompts(language, role), [language, role]);

  useEffect(() => {
    const syncRole = () => setRole(getUserRole());
    syncRole();
    window.addEventListener("storage", syncRole);
    window.addEventListener("storage_user_changed", syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("storage_user_changed", syncRole);
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(language, role));
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([
          {
            role: "assistant",
            content: initialGreeting(language, role),
          },
        ]);
      }
    } catch (_error) {
      setMessages([
        {
          role: "assistant",
          content: initialGreeting(language, role),
        },
      ]);
    }
  }, [language, role]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(language, role), JSON.stringify(messages));
    } catch (_error) {
      // ignore
    }
  }, [messages, language, role]);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [open, messages]);

  const sendMessage = async (content) => {
    const text = String(content || "").trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await aiAssistantService.chat({
        messages: nextMessages.slice(-12),
        language,
        role,
        page: "home",
      });

      const reply =
        res?.data?.reply ||
        res?.reply ||
        (language === "vi" ? "Mình chưa nhận được phản hồi từ AI." : "I did not receive a reply from the AI.");
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        (language === "vi" ? "Không thể kết nối AI" : "Unable to connect to AI");
      Swal.fire({
        icon: "error",
        title: language === "vi" ? "Lỗi AI" : "AI Error",
        text: message,
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const bubbleBase = isDark ? "bg-white/5 text-slate-100" : "bg-white text-slate-800";

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className={`flex h-[min(80vh,640px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-[28px] border shadow-2xl ${
            isDark ? "border-white/10 bg-[#0b1020] text-white" : "border-orange-100 bg-white text-slate-900"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              isDark ? "border-white/10" : "border-orange-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/20">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-black">PhotoHub AI</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {role === "photographer"
                    ? language === "vi"
                      ? "Hỗ trợ photographer"
                      : "Photographer support"
                    : role === "customer"
                      ? language === "vi"
                        ? "Hỗ trợ khách hàng"
                        : "Customer support"
                      : language === "vi"
                        ? "Trợ lý chung"
                        : "General assistant"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-orange-100 bg-white text-slate-700 hover:bg-orange-50"
              }`}
              aria-label="Close AI chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isUser ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : bubbleBase
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className={`inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm ${bubbleBase}`}>
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                  {language === "vi" ? "Đang nghĩ..." : "Thinking..."}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={`border-t px-4 py-3 ${isDark ? "border-white/10" : "border-orange-100"}`}>
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className={`rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
                    isDark
                      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      : "border-orange-100 bg-orange-50 text-slate-700 hover:border-orange-300 hover:bg-orange-100"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder={language === "vi" ? "Nhập câu hỏi của bạn..." : "Ask me anything..."}
                className={`min-h-[52px] flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-orange-400"
                    : "border-orange-100 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-400"
                }`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-orange-500/25 transition hover:brightness-110"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span>{language === "vi" ? "Hỏi AI" : "Ask AI"}</span>
        <Sparkles size={16} />
      </button>
    </div>
  );
}
