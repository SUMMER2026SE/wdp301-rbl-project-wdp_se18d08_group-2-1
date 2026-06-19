import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import { Send, User, MessageSquare, AlertCircle, Paperclip, X } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function PhotographerChat({ theme = "dark", language = "vi" }) {
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUserId = localStorage.getItem("userId") || ""; // Assuming userId is stored in localStorage

  const t = {
    vi: {
      title: "Realtime Chat",
      noConversations: "Chưa có cuộc hội thoại nào",
      noMessages: "Chọn một cuộc trò chuyện để bắt đầu nhắn tin",
      inputPlaceholder: "Nhập tin nhắn...",
      send: "Gửi",
      error: "Đã xảy ra lỗi",
      recipient: "Người nhận:",
    },
    en: {
      title: "Realtime Chat",
      noConversations: "No active conversations",
      noMessages: "Select a conversation to start chatting",
      inputPlaceholder: "Type a message...",
      send: "Send",
      error: "An error occurred",
      recipient: "Chatting with:",
    },
  }[language];

  // 1. Connect Socket.IO
  useEffect(() => {
    // Connect to backend server
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to Chat socket server:", socketRef.current.id);
    });

    socketRef.current.on("receiveMessage", (message) => {
      setMessages((prev) => {
        // Only append if it belongs to the current open conversation and isn't already added
        if (message.conversationId === activeConv?._id && !prev.some((m) => m._id === message._id)) {
          return [...prev, message];
        }
        return prev;
      });
      scrollToBottom();
    });

    socketRef.current.on("chatError", (err) => {
      console.error("Socket error event:", err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeConv]);

  // 2. Fetch Conversations
  const fetchConversations = async () => {
    setLoadingConv(true);
    try {
      const res = await photographerMarketplaceService.getConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 3. Select Conversation & Load Messages
  const handleSelectConversation = async (conv) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      // Join conversation room in Socket
      if (socketRef.current) {
        socketRef.current.emit("joinConversation", conv._id);
      }

      const res = await photographerMarketplaceService.getMessages(conv._id);
      setMessages(res.data || []);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoadingMsgs(false);
    }
  };

  // 4. Send Message
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
      setMessages((prev) => (prev.some((m) => m._id === savedMessage._id) ? prev : [...prev, savedMessage]));
      setInputText("");
      setAttachments([]);
      setMessageType("text");
      scrollToBottom();
      fetchConversations();
    } catch (err) {
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getRecipientInfo = (conv) => {
    // Find the participant that is not the current user
    const recipient = conv.participants?.find((p) => p._id !== currentUserId);
    return recipient || { fullName: "User", email: "user@example.com" };
  };

  return (
    <div className={`p-6 rounded-3xl border h-[600px] flex ${isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 w-full h-full gap-6">
        
        {/* Conversations Sidebar */}
        <div className="md:col-span-1 border-r border-slate-200 dark:border-white/[0.04] pr-4 flex flex-col h-full overflow-hidden">
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-cyan-400" />
            {t.title}
          </h3>

          {loadingConv ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t.noConversations}</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {conversations.map((conv) => {
                const recipient = getRecipientInfo(conv);
                const isSelected = activeConv?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30 text-cyan-400"
                        : isDark
                        ? "bg-white/[0.01] border border-white/5 hover:bg-white/[0.03]"
                        : "bg-slate-50 border border-slate-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {recipient.avatar ? (
                          <img src={recipient.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-cyan-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate text-slate-200">{recipient.fullName || recipient.email}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.text || "..."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messaging Box */}
        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
          {activeConv ? (
            <div className="flex flex-col h-full justify-between">
              {/* Header */}
              <div className="pb-3 border-b border-slate-200 dark:border-white/[0.04] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  {getRecipientInfo(activeConv).avatar ? (
                    <img src={getRecipientInfo(activeConv).avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-cyan-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {getRecipientInfo(activeConv).fullName || getRecipientInfo(activeConv).email}
                  </h4>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">
                    {getRecipientInfo(activeConv).role}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-50 animate-bounce" />
                    <p className="text-xs font-semibold">{t.noMessages}</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.senderId === currentUserId;
                    return (
                      <div key={m._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                            isOwn
                              ? "bg-cyan-500 text-white rounded-tr-none shadow-md shadow-cyan-500/10"
                              : isDark
                              ? "bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none"
                              : "bg-slate-100 text-slate-900 rounded-tl-none"
                          }`}
                        >
                          {m.text && <p>{m.text}</p>}
                          {m.attachments?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {m.attachments.map((file, index) => (
                                <a
                                  key={`${file.url}-${index}`}
                                  href={`http://localhost:3000${file.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-lg bg-black/10 px-2 py-1 text-[10px] underline"
                                >
                                  {file.originalName || file.url}
                                </a>
                              ))}
                            </div>
                          )}
                          <span className="text-[8px] opacity-60 block text-right mt-1.5 font-normal">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
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
                  className={`p-3.5 rounded-2xl border transition ${isDark ? "border-white/5 hover:bg-white/5 text-slate-400" : "border-slate-200 hover:bg-slate-100 text-slate-500"}`}
                  title="Attach evidence file"
                >
                  <Paperclip size={16} />
                </button>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className={`rounded-2xl px-3 py-3.5 text-xs outline-none border font-bold transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-900"
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
                  className={`flex-1 rounded-2xl px-4 py-3.5 text-xs outline-none border font-medium transition-all ${
                    isDark
                      ? "bg-[#09090b] border-white/5 focus:border-cyan-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-cyan-500 focus:bg-white text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white p-3.5 rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-[0.95]"
                >
                  <Send size={16} />
                </button>
              </form>
              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded-xl bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                        className="text-cyan-200 hover:text-red-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <MessageSquare size={36} className="mb-2 opacity-50 animate-bounce" />
              <p className="text-sm font-semibold">{t.noMessages}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
