/**
 * GroupChat.jsx
 *
 * Realtime Group Chat Modal cho thành viên nhóm chụp ảnh chung.
 * - Sử dụng Socket.IO room (group:groupId) để nhận tin nhắn mới tức thì
 * - Tải lịch sử tin nhắn từ API /api/group-bookings/:groupId/messages
 * - Chỉ cho phép người đã vào nhóm nhắn tin (chưa vào nhóm sẽ bị chặn)
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageSquare, Loader2, Crown, ShieldAlert } from "lucide-react";
import { io } from "socket.io-client";
import { groupBookingService } from "../../services/groupBookingService";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export default function GroupChat({
  groupId,
  groupCode,
  isDark = true,
  isMember = false,
  leaderId,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatEndRef = useRef(null);

  const currentUser = getUser();
  const currentUserId = currentUser._id || currentUser.id;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch message history
  useEffect(() => {
    if (!groupId || !isMember) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await groupBookingService.getGroupMessages(groupId);
        if (isMounted && res.success) {
          setMessages(res.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.response?.data?.message || err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [groupId, isMember]);

  // Scroll bottom after load or new message
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 2. Realtime Socket.IO Connection
  useEffect(() => {
    if (!groupId || !isMember) return;

    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      socket.emit("join-group-room", groupId);
    });

    // Lắng nghe tin nhắn mới realtime từ server
    socket.on("new-group-message", (newMsg) => {
      if (newMsg && String(newMsg.group) === String(groupId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      socket.emit("leave-group-room", groupId);
      socket.disconnect();
    };
  }, [groupId, isMember]);

  // 3. Send message handler
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending || !isMember) return;

    const msgContent = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await groupBookingService.sendGroupMessage(groupId, msgContent);
      if (res.success && res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-xl h-[85vh] max-h-[700px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease-out] ${
          isDark
            ? "bg-[#0c101c] border-white/10 text-white shadow-black/50"
            : "bg-white border-slate-200 text-slate-900 shadow-slate-300/50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                  Chat Nhóm Chụp Ảnh
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {groupCode || "Group"}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                 Chat nhóm • Chỉ thành viên nhóm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? "border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
                : "border-slate-200 hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body: Chat Messages List ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!isMember ? (
            /* Warning if not a member */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-16 w-16 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <ShieldAlert size={32} />
              </div>
              <h4 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                Bạn chưa tham gia nhóm này
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Chỉ những thành viên đã gia nhập nhóm mới có quyền xem lịch sử và gửi tin nhắn trò chuyện với mọi người.
              </p>
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="h-full flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-400 mb-3" />
              <p className="text-xs text-slate-400">Đang tải cuộc trò chuyện...</p>
            </div>
          ) : messages.length === 0 ? (
            /* Empty Chat State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-1">
                <MessageSquare size={28} />
              </div>
              <p className={`font-bold text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Chưa có tin nhắn nào
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Hãy là người đầu tiên gửi lời chào tới các thành viên trong nhóm chụp! 👋
              </p>
            </div>
          ) : (
            /* Message List */
            messages.map((msg, index) => {
              const sender = msg.sender || {};
              const senderId = sender._id || sender.id || sender;
              const isMe = String(senderId) === String(currentUserId);
              const senderName = sender.fullName || "Thành viên";
              const senderAvatar = sender.avatar;
              const isSenderLeader = leaderId && String(senderId) === String(leaderId);

              return (
                <div
                  key={msg._id || index}
                  className={`flex items-start gap-2.5 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center border border-orange-500/20 text-xs font-bold text-orange-400 mt-1">
                    {senderAvatar ? (
                      <img src={senderAvatar} alt={senderName} className="h-full w-full object-cover" />
                    ) : (
                      senderName[0]?.toUpperCase()
                    )}
                  </div>

                  {/* Message Content Bubble */}
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 px-1 mb-1">
                        <span className={`text-[11px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {senderName}
                        </span>
                        {isSenderLeader && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Crown size={10} /> Leader
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-tr-xs"
                          : isDark
                          ? "bg-white/[0.07] border border-white/[0.08] text-slate-200 rounded-tl-xs"
                          : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-xs"
                      }`}
                    >
                      {msg.message}
                    </div>

                    <p className={`text-[10px] px-1 mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Error notification banner if any ── */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="hover:underline text-[11px]">Đóng</button>
          </div>
        )}

        {/* ── Footer: Input Form ── */}
        {isMember && (
          <form
            onSubmit={handleSend}
            className={`p-3 sm:p-4 border-t flex items-center gap-2 shrink-0 ${
              isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-slate-100 bg-slate-50"
            }`}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn trò chuyện với nhóm..."
              maxLength={1000}
              disabled={sending}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm outline-none border transition-all ${
                isDark
                  ? "bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500"
              }`}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shrink-0 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/20"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
