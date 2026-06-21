import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import { Send, User, MessageSquare, AlertCircle, Paperclip, X } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

const API_ORIGIN = "http://localhost:3000";

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const safeParse = (value, fallback = {}) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
};

const decodeTokenPayload = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return {};
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch (_error) {
    return {};
  }
};

const getCurrentUserId = () => {
  const storedUser = safeParse(localStorage.getItem("user"));
  const tokenPayload = decodeTokenPayload();
  return normalizeId(
    localStorage.getItem("userId") ||
      storedUser._id ||
      storedUser.id ||
      storedUser.userId ||
      tokenPayload.id ||
      tokenPayload._id ||
      tokenPayload.userId
  );
};

const getMessageConversationId = (message) => normalizeId(message?.conversationId);

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function PhotographerChat({ theme = "dark", language = "vi", initialActiveConvId = null }) {
  const isDark = theme === "dark";
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [attachments, setAttachments] = useState([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const socketRef = useRef(null);
  const activeConvRef = useRef(null);
  const refreshConversationsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUserId = getCurrentUserId();

  const t = {
    vi: {
      title: "Realtime Chat",
      noConversations: "Ch\u01b0a c\u00f3 cu\u1ed9c h\u1ed9i tho\u1ea1i n\u00e0o",
      noMessages: "Ch\u1ecdn m\u1ed9t cu\u1ed9c tr\u00f2 chuy\u1ec7n \u0111\u1ec3 b\u1eaft \u0111\u1ea7u nh\u1eafn tin",
      inputPlaceholder: "Nh\u1eadp tin nh\u1eafn...",
      error: "\u0110\u00e3 x\u1ea3y ra l\u1ed7i",
      attach: "\u0110\u00ednh k\u00e8m file",
      unnamed: "Ng\u01b0\u1eddi d\u00f9ng",
    },
    en: {
      title: "Realtime Chat",
      noConversations: "No active conversations",
      noMessages: "Select a conversation to start chatting",
      inputPlaceholder: "Type a message...",
      error: "An error occurred",
      attach: "Attach file",
      unnamed: "User",
    },
  }[language] || {};

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 80);
  };

  const getRecipientInfo = (conv) => {
    const recipient = conv?.participants?.find((p) => normalizeId(p) !== currentUserId);
    return recipient || { fullName: t.unnamed || "User", email: "" };
  };

  async function handleSelectConversation(conv) {
    if (!conv?._id) return;
    setActiveConv(conv);
    activeConvRef.current = conv;
    setLoadingMsgs(true);

    try {
      socketRef.current?.emit("joinConversation", conv._id);
      const res = await photographerMarketplaceService.getMessages(conv._id);
      setMessages(res.data || []);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function fetchConversations(autoSelectId = null, options = {}) {
    if (!options.silent) setLoadingConv(true);

    try {
      const res = await photographerMarketplaceService.getConversations();
      const list = res.data || [];
      setConversations(list);

      const targetId = normalizeId(autoSelectId || initialActiveConvId || activeConvRef.current?._id);
      if (targetId) {
        const found = list.find((c) => normalizeId(c) === targetId);
        if (found && normalizeId(activeConvRef.current) !== targetId) {
          await handleSelectConversation(found);
        }
        return;
      }

      if (!activeConvRef.current && list.length > 0) {
        await handleSelectConversation(list[0]);
      }
    } catch (err) {
      console.error(err);
      if (!options.silent) {
        Swal.fire(t.error, err.response?.data?.message || err.message, "error");
      }
    } finally {
      if (!options.silent) setLoadingConv(false);
    }
  }

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    refreshConversationsRef.current = fetchConversations;
  });

  useEffect(() => {
    const socket = io(API_ORIGIN, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (currentUserId) socket.emit("join-user-room", currentUserId);
      if (activeConvRef.current?._id) socket.emit("joinConversation", activeConvRef.current._id);
    });

    socket.on("receiveMessage", (message) => {
      const messageConversationId = getMessageConversationId(message);
      const activeId = normalizeId(activeConvRef.current);

      if (messageConversationId && messageConversationId === activeId) {
        setMessages((prev) => (prev.some((m) => normalizeId(m) === normalizeId(message)) ? prev : [...prev, message]));
        scrollToBottom();
      }

      setConversations((prev) => {
        let touched = false;
        const next = prev.map((conv) => {
          if (normalizeId(conv) !== messageConversationId) return conv;
          touched = true;
          return {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt || new Date().toISOString(),
          };
        });
        if (!touched) return prev;
        return next.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });

      refreshConversationsRef.current?.(activeId || initialActiveConvId, { silent: true });
    });

    socket.on("conversationUpdated", (payload = {}) => {
      refreshConversationsRef.current?.(payload.conversationId || activeConvRef.current?._id || initialActiveConvId, {
        silent: true,
      });
    });

    socket.on("chatError", (err) => {
      console.error("Socket error event:", err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, initialActiveConvId]);

  useEffect(() => {
    fetchConversations(initialActiveConvId);
  }, [initialActiveConvId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || !activeConv) return;

    try {
      const res = await photographerMarketplaceService.sendChatMessage(activeConv._id, {
        text: inputText.trim(),
        messageType,
        attachments,
        metadata: {
          bookingId: activeConv.bookingId,
          jobPostId: activeConv.jobPostId,
        },
      });

      const savedMessage = res.data;
      setMessages((prev) => (prev.some((m) => normalizeId(m) === normalizeId(savedMessage)) ? prev : [...prev, savedMessage]));
      setInputText("");
      setAttachments([]);
      setMessageType("text");
      if (fileInputRef.current) fileInputRef.current.value = "";
      scrollToBottom();
      fetchConversations(activeConv._id, { silent: true });
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  return (
    <div className={`p-4 rounded-2xl border h-[550px] flex ${isDark ? "bg-[#121214]/80 border-white/[0.08]" : "bg-white border-orange-100 shadow-sm"}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 w-full h-full gap-4">
        <div className="md:col-span-1 border-r border-slate-200 dark:border-white/[0.06] pr-3 flex flex-col h-full overflow-hidden">
          <h3 className="font-extrabold text-base mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-orange-500" />
            {t.title}
          </h3>

          {loadingConv ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t.noConversations}</p>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {conversations.map((conv) => {
                const recipient = getRecipientInfo(conv);
                const isSelected = normalizeId(activeConv) === normalizeId(conv);
                const avatarUrl = getMediaUrl(recipient.avatar);

                return (
                  <button
                    type="button"
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition text-left ${
                      isSelected
                        ? "bg-orange-500 text-white border border-orange-500 shadow-sm shadow-orange-500/20"
                        : isDark
                        ? "bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-slate-100"
                        : "bg-orange-50/60 border border-orange-100 hover:bg-orange-50 text-slate-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-[1.5px] shrink-0">
                      <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isDark ? "bg-slate-950" : "bg-white"}`}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-orange-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[11px] truncate ${isSelected ? "text-white" : isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {recipient.fullName || recipient.email || t.unnamed}
                      </p>
                      <p className={`text-[9px] truncate mt-0.5 ${isSelected ? "text-white/80" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {conv.lastMessage?.text || "..."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
          {activeConv ? (
            <div className="flex flex-col h-full justify-between">
              <div className="pb-2.5 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2.5">
                {(() => {
                  const recipient = getRecipientInfo(activeConv);
                  const avatarUrl = getMediaUrl(recipient.avatar);
                  return (
                    <>
                      <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-orange-100 dark:border-white/10">
                        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={13} className="text-orange-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{recipient.fullName || recipient.email || t.unnamed}</h4>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500 font-extrabold">{recipient.role}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">{t.noMessages}</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = normalizeId(m.senderId) === currentUserId;
                    return (
                      <div key={m._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] p-3 rounded-xl text-xs leading-relaxed font-semibold ${
                            isOwn
                              ? "bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-500/20"
                              : isDark
                              ? "bg-white/[0.05] border border-white/8 text-slate-100 rounded-tl-none"
                              : "bg-orange-50 border border-orange-100 text-slate-900 rounded-tl-none"
                          }`}
                        >
                          {m.text && <p>{m.text}</p>}
                          {m.attachments?.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {m.attachments.map((file, index) => (
                                <a
                                  key={`${file.url}-${index}`}
                                  href={getMediaUrl(file.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded bg-black/10 px-1.5 py-0.5 text-[9px] underline"
                                >
                                  {file.originalName || file.url}
                                </a>
                              ))}
                            </div>
                          )}
                          <span className="text-[8px] opacity-60 block text-right mt-1 font-normal">
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border transition ${isDark ? "border-white/8 hover:bg-white/5 text-slate-300" : "border-orange-100 hover:bg-orange-50 text-slate-600"}`}
                  title={t.attach}
                >
                  <Paperclip size={14} />
                </button>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className={`rounded-xl px-2 py-2 text-xs outline-none border font-bold transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/8 focus:border-orange-500 text-white"
                      : "bg-orange-50/60 border-orange-100 focus:border-orange-500 text-slate-900"
                  }`}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="file">File</option>
                  <option value="proposal">Proposal</option>
                  <option value="package">Package</option>
                  <option value="booking_detail">Booking</option>
                </select>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/8 focus:border-orange-500 text-white"
                      : "bg-white border-orange-100 focus:border-orange-500 text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition shadow-md shadow-orange-500/10 active:scale-[0.95]"
                >
                  <Send size={14} />
                </button>
              </form>
              {attachments.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {attachments.map((file, index) => (
                    <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-300">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                        className="text-orange-600 dark:text-orange-300 hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <MessageSquare size={36} className="mb-2 opacity-50" />
              <p className="text-sm font-semibold">{t.noMessages}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
