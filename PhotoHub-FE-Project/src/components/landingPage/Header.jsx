import { Camera, Menu, Moon, ShieldCheck, Sun, X, User, LogOut, Settings, Briefcase, Heart, Bell, MessageSquare, Calendar } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const iconProps = { strokeWidth: 1.5 };

const copy = {
  en: {
    navItems: [
      { label: "About Us", href: "/#ecosystem" },
      { label: "Photographer", href: "/photographers", isRoute: true },
      { label: "Booking", href: "/#workflow" },
      { label: "Community", href: "/community", isRoute: true },
    ],
    cta: "Login",
    languageLabel: "Chuyển sang tiếng Việt",
    themeLabel: {
      dark: "Light mode",
      light: "Dark mode",
    },
    profileLabel: "Profile",
    dashboardLabel: "Photographer Space",
    favoritesLabel: "Favorite Photographers",
    notificationsLabel: "Notifications",
    noNotifications: "No notifications yet",
    markAllRead: "Mark all as read",
    clearAll: "Clear all",
  },
  vi: {
    navItems: [
      { label: "Giới thiệu", href: "/#ecosystem" },
      { label: "Nhiếp Ảnh Gia", href: "/photographers", isRoute: true },
      { label: "Đặt Lịch", href: "/#workflow" },
      { label: "Diễn Đàn", href: "/community", isRoute: true },
    ],
    cta: "Đăng nhập",
    languageLabel: "Switch to English",
    themeLabel: {
      dark: "Giao diện sáng",
      light: "Giao diện tối",
    },
    profileLabel: "Hồ sơ cá nhân",
    dashboardLabel: "Không gian Nhiếp ảnh",
    favoritesLabel: "Nhiếp ảnh gia yêu thích",
    notificationsLabel: "Thông báo",
    noNotifications: "Chưa có thông báo nào",
    markAllRead: "Đánh dấu đã đọc tất cả",
    clearAll: "Xóa tất cả",
  },
};

function BrandMark() {
  const handleClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <Link to="/" onClick={handleClick} className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-orange-500 dark:text-orange-200 shadow-[0_0_35px_rgba(249,115,22,0.18)] backdrop-blur-md transition-all duration-500 group-hover:border-orange-300/50">
        <Camera className="h-5 w-5" {...iconProps} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
        PhotoHub
      </span>
    </Link>
  );
}

function formatRelativeTime(dateStr, lang) {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return lang === "vi" ? "Vừa xong" : "Just now";
    }
    if (diffMins < 60) {
      return lang === "vi" ? `${diffMins} phút trước` : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return lang === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return lang === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    }
    return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (_e) {
    return "";
  }
}

export default function Header({ language, theme, onToggleLanguage, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem("photohub-notifications");
      return stored ? JSON.parse(stored) : [];
    } catch (_e) {
      return [];
    }
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("storage_user_changed", checkUser);
    window.addEventListener("storage", checkUser);

    return () => {
      window.removeEventListener("storage_user_changed", checkUser);
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("photohub-notifications");
        setNotifications(stored ? JSON.parse(stored) : []);
      } catch (_e) {
        setNotifications([]);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("storage_notifications_changed", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storage_notifications_changed", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const userId = user._id || user.id;
    if (!userId) return;

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-user-room", userId);
      console.log(`[Socket] Joined user room: user:${userId}`);
    });

    const addNotification = (type, title, message, targetUrl) => {
      const newNotif = {
        id: String(Date.now() + Math.random()),
        type,
        title,
        message,
        targetUrl,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem("photohub-notifications", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage_notifications_changed"));
        return updated;
      });
    };

    const showToast = (titleText, bodyText) => {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        icon: "info",
        title: titleText,
        text: bodyText,
        background: theme === "dark" ? "#0f172a" : "#ffffff",
        color: theme === "dark" ? "#f8fafc" : "#0f172a",
        customClass: {
          popup: "shadow-2xl border border-orange-500/20 rounded-2xl",
        },
      });
    };

    socket.on("receiveMessage", (message) => {
      const msgSenderId = message.senderId?._id || message.senderId?.id || message.senderId;
      if (String(msgSenderId) === String(userId)) return;

      const senderName = message.senderId?.fullName || "Ai đó";
      const text = message.text || "Hình ảnh hoặc đính kèm";

      const title = {
        en: "New Message",
        vi: "Tin nhắn mới",
      };
      const msgContent = {
        en: `New message from ${senderName}: "${text}"`,
        vi: `Tin nhắn mới từ ${senderName}: "${text}"`,
      };

      addNotification("chat", title, msgContent, "/chat");

      if (window.location.pathname !== "/chat") {
        showToast(
          language === "vi" ? "Tin nhắn mới" : "New Message",
          language === "vi" ? `${senderName}: ${text}` : `${senderName}: ${text}`
        );
      }
    });

    socket.on("new-booking-request", (payload) => {
      const customerName = payload.customer?.fullName || "Khách hàng";
      const titleStr = payload.title || "Yêu cầu đặt lịch";

      const title = {
        en: "New Booking Request",
        vi: "Yêu cầu đặt lịch mới",
      };
      const msgContent = {
        en: `${customerName} requested a booking: "${titleStr}"`,
        vi: `${customerName} yêu cầu đặt lịch: "${titleStr}"`,
      };

      addNotification("booking-request", title, msgContent, "/photographerProfile");

      showToast(
        language === "vi" ? "Yêu cầu đặt lịch mới" : "New Booking Request",
        language === "vi" ? `${customerName}: ${titleStr}` : `${customerName}: ${titleStr}`
      );
    });

    socket.on("booking-status-updated", (payload) => {
      const status = payload.status;
      const bookingId = payload.bookingId;
      const isPhotog = user?.role === "photographer";

      let title = { en: "Booking Updated", vi: "Cập nhật lịch đặt" };
      let msgContent = { en: `Booking status updated to ${status}`, vi: `Lịch đặt đã chuyển sang trạng thái: ${status}` };
      let target = isPhotog ? "/photographerProfile" : "/profile";

      if (status === "cancelled") {
        title = { en: "Booking Cancelled", vi: "Lịch đặt đã bị hủy" };
        msgContent = {
          en: `Booking ID ${bookingId} was cancelled by the customer.`,
          vi: `Lịch đặt mã ${bookingId} đã bị khách hàng hủy.`,
        };
      } else if (status === "accepted") {
        title = { en: "Booking Accepted", vi: "Chấp nhận lịch hẹn" };
        msgContent = {
          en: "The photographer accepted your booking! Please complete the deposit payment.",
          vi: "Nhiếp ảnh gia đã chấp nhận lịch đặt! Vui lòng thanh toán tiền đặt cọc.",
        };
      } else if (status === "rejected") {
        const reason = payload.reason || payload.rejectReason || "";
        title = { en: "Booking Rejected", vi: "Từ chối lịch hẹn" };
        msgContent = {
          en: `Your booking was rejected. ${reason ? `Reason: ${reason}` : ""}`,
          vi: `Lịch đặt của bạn đã bị từ chối. ${reason ? `Lý do: ${reason}` : ""}`,
        };
      } else if (status === "completed") {
        title = { en: "Booking Completed", vi: "Lịch đặt hoàn thành" };
        msgContent = {
          en: "Your booking is completed. The final album is ready!",
          vi: "Lịch đặt đã hoàn thành. Album ảnh cuối cùng của bạn đã sẵn sàng!",
        };
      }

      addNotification("booking-status", title, msgContent, target);

      showToast(
        language === "vi" ? title.vi : title.en,
        language === "vi" ? msgContent.vi : msgContent.en
      );
    });

    socket.on("booking-paid", (payload) => {
      const bookingId = payload.bookingId;
      const isPhotog = user?.role === "photographer";
      const amount = payload.amount || 0;
      const formattedAmount = amount.toLocaleString("vi-VN");

      const title = {
        en: "Booking Payment Confirmed",
        vi: "Thanh toán thành công",
      };

      const msgContent = isPhotog
        ? {
            en: `Booking ${bookingId} has been paid. Amount: ${formattedAmount} VND.`,
            vi: `Lịch đặt ${bookingId} đã được thanh toán. Số tiền: ${formattedAmount} VNĐ.`,
          }
        : {
            en: `Deposit for booking ${bookingId} was paid successfully. Amount: ${formattedAmount} VND.`,
            vi: `Thanh toán cọc cho lịch đặt ${bookingId} thành công. Số tiền: ${formattedAmount} VNĐ.`,
          };

      const target = isPhotog ? "/photographerProfile" : "/profile";

      addNotification("booking-paid", title, msgContent, target);

      showToast(
        language === "vi" ? title.vi : title.en,
        language === "vi" ? msgContent.vi : msgContent.en
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, language, theme]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest("#notif-bell-wrapper")) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showNotifDropdown]);

  const handleNotificationClick = (notif) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
      localStorage.setItem("photohub-notifications", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage_notifications_changed"));
      return updated;
    });
    setShowNotifDropdown(false);
    navigate(notif.targetUrl);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("photohub-notifications", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage_notifications_changed"));
      return updated;
    });
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
    localStorage.setItem("photohub-notifications", JSON.stringify([]));
    window.dispatchEvent(new Event("storage_notifications_changed"));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const t = copy[language] || copy.en;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Resolve profile route from user role
  const isPhotographer = user?.role === "photographer";
  const profileTargetRoute = isPhotographer ? "/photographerProfile" : "/profile";

  const isDark = theme === "dark";
  const shellClass = isDark
    ? scrolled
      ? "border-white/10 bg-slate-950/85 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
      : "border-white/10 bg-slate-950/75 shadow-[0_18px_60px_rgba(0,0,0,0.2)]"
    : "border-orange-100 bg-white/95 shadow-[0_18px_60px_rgba(249,115,22,0.12)]";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-4 py-4 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border px-4 py-3 backdrop-blur-md transition-all duration-500 sm:px-5 ${shellClass}`}
      >
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex">
          {t.navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => {
                if (location.pathname + location.hash === item.href || (location.pathname === "/" && item.href === "/#ecosystem" && location.hash === "#ecosystem")) {
                  if (item.href.includes("#")) {
                    const id = item.href.split("#")[1];
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* ================= NOTIFICATION BELL & DROPDOWN ================= */}
          {user && (
            <div id="notif-bell-wrapper" className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-all duration-300 hover:border-orange-300/50 hover:bg-white/[0.09] relative"
                aria-label={t.notificationsLabel}
                title={t.notificationsLabel}
              >
                <Bell className="h-4 w-4" {...iconProps} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 top-full z-[120] mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-4 py-3 bg-slate-50 dark:bg-white/[0.02]">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      {t.notificationsLabel}
                    </span>
                    <div className="flex items-center gap-3">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-orange-500 hover:text-orange-400 font-medium transition"
                          >
                            {t.markAllRead}
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="text-xs text-red-500 hover:text-red-400 font-medium transition"
                          >
                            {t.clearAll}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-500">
                        <Bell className="h-8 w-8 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
                        <span className="text-xs">{t.noNotifications}</span>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isUnread = !notif.read;
                        const notifTitle = notif.title[language] || notif.title.en || "";
                        const notifMsg = notif.message[language] || notif.message.en || "";

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.08] transition duration-200 border-b border-slate-100 dark:border-white/5 last:border-0 ${
                              isUnread ? "bg-orange-500/[0.03] dark:bg-orange-500/[0.04]" : ""
                            }`}
                          >
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.06] text-orange-500">
                              {notif.type === "chat" ? (
                                <MessageSquare className="h-4 w-4" />
                              ) : notif.type === "booking-request" ? (
                                <Calendar className="h-4 w-4" />
                              ) : (
                                <Briefcase className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${isUnread ? "text-orange-500 dark:text-orange-300" : "text-slate-700 dark:text-slate-200"}`}>
                                {notifTitle}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notifMsg}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {formatRelativeTime(notif.createdAt, language)}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-orange-500 self-center" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onToggleLanguage}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:border-orange-300/50 hover:bg-white/[0.09]"
            aria-label={t.languageLabel}
            title={t.languageLabel}
          >
            {language === "en" ? "VI" : "EN"}
          </button>

          <button
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition-all duration-300 hover:border-orange-300/50 hover:bg-white/[0.09]"
            aria-label={t.themeLabel[theme]}
            title={t.themeLabel[theme]}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" {...iconProps} />
            ) : (
              <Moon className="h-4 w-4" {...iconProps} />
            )}
          </button>

          {/* ================= DESKTOP USER DROPDOWN ================= */}
          {user ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* AVATAR */}
              <div className="flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-3 py-2 backdrop-blur-md">
                {user.avatar ? (
                  <img
                    src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:3000${user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`}`}
                    alt="User avatar"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-500/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-semibold">
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="text-left">
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Hello,
                  </p>
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-200 dark:text-slate-100">
                    {user.fullName}
                  </p>
                </div>
              </div>

              {/* DROPDOWN MENU */}
              {showDropdown && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                    
                    {/* Dynamic route by role */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white border-b border-slate-100 dark:border-white/5"
                      >
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        Admin Space
                      </Link>
                    )}

                    <Link
                      to={profileTargetRoute}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {isPhotographer ? <Briefcase className="h-4 w-4 text-orange-500" /> : <User className="h-4 w-4" />}
                      {isPhotographer ? t.dashboardLabel : t.profileLabel}
                    </Link>

                    {/* Customer favorites */}
                    {!isPhotographer && (
                      <Link
                        to="/favorites"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Heart className="h-4 w-4 text-rose-400" />
                        {t.favoritesLabel}
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black border border-white/20 hover:bg-white hover:text-black transition-none"
            >
              {t.cta}
            </Link>
          )}

          <button
            onClick={() => setShowMobileNav((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            {showMobileNav ? (
              <X className="h-5 w-5" {...iconProps} />
            ) : (
              <Menu className="h-5 w-5" {...iconProps} />
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE NAVIGATION ================= */}
      {showMobileNav && (
        <div className="mx-auto mt-3 max-w-7xl rounded-3xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:hidden">
          {t.navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => {
                setShowMobileNav(false);
                if (location.pathname + location.hash === item.href || (location.pathname === "/" && item.href === "/#ecosystem" && location.hash === "#ecosystem")) {
                  if (item.href.includes("#")) {
                    const id = item.href.split("#")[1];
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
              <ShieldCheck className="h-4 w-4 text-orange-300" {...iconProps} />
            </Link>
          ))}

          {/* Mobile user actions */}
          {user ? (
            <>
              {/* Mobile user actions */}
              <Link
                to={profileTargetRoute}
                onClick={() => setShowMobileNav(false)}
                className="mt-2 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.08]"
              >
                <span className="flex items-center gap-2">
                  {isPhotographer ? <Briefcase className="h-4 w-4 text-orange-500" /> : <User className="h-4 w-4" />}
                  {isPhotographer ? t.dashboardLabel : t.profileLabel}
                </span>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
              </Link>

              {/* Customer favorites */}
              {!isPhotographer && (
                <Link
                  to="/favorites"
                  onClick={() => setShowMobileNav(false)}
                  className="mt-1 flex items-center justify-between rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t.favoritesLabel}
                  </span>
                </Link>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
                className="mt-1 flex w-full items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
              >
                Logout
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setShowMobileNav(false)}
              className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-100"
            >
              {t.cta}
              <ShieldCheck className="h-4 w-4 text-slate-950" {...iconProps} />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
