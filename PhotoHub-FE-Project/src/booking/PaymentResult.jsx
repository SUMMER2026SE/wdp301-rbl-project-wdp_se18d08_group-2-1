import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Home, Calendar, Loader2 } from "lucide-react";
import { bookingService } from "../services/bookingService";
import { subscriptionService } from "../services/subscriptionService";

export default function PaymentResult({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const bookingId = queryParams.get("bookingId");
  const orderCode = queryParams.get("orderCode");
  const explicitSource = queryParams.get("source");
  const paymentKind = queryParams.get("paymentKind");
  const source = explicitSource || (paymentKind ? "subscription" : "booking");
  const isCanceled = queryParams.get("canceled") === "true" || queryParams.get("cancel") === "true";
  const [checking, setChecking] = useState(Boolean((bookingId || orderCode) && !isCanceled));
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState("");
  const triggerMembershipCelebration = (tier = "Silver") => {
    try {
      const payload = {
        active: true,
        tier,
        expiresAt: Date.now() + 1000 * 60 * 60 * 12,
      };
      localStorage.setItem("photohub-membership-effect", JSON.stringify(payload));
      window.dispatchEvent(new Event("membership_effect_changed"));
      window.dispatchEvent(new Event("subscription_history_changed"));
    } catch (_error) {
      // best effort only
    }
  };

  const t = {
    vi: {
      checkingTitle: "Đang kiểm tra thanh toán...",
      checkingSub: "PhotoHub đang đồng bộ trạng thái từ PayOS. Vui lòng chờ một chút.",
      successTitle: "Thanh toán thành công!",
      successSub: "Lịch chụp của bạn đã được xác nhận. Tiền đang được giữ an toàn và sẽ chuyển vào ví photographer sau khi dự án hoàn tất.",
      pendingTitle: "Chưa xác nhận thanh toán",
      pendingSub: "Giao dịch chưa hoàn tất hoặc PayOS chưa gửi xác nhận. Bạn có thể quay lại danh sách booking để thanh toán lại.",
      failTitle: "Thanh toán bị hủy",
      failSub: "Giao dịch đã bị hủy. Booking vẫn ở trạng thái chờ thanh toán nếu photographer đã chấp nhận.",
      orderCodeLabel: "Mã đơn hàng:",
      goBookingsBtn: "Quản lý lịch đặt của tôi",
      goHomeBtn: "Về trang chủ",
    },
    en: {
      checkingTitle: "Checking payment...",
      checkingSub: "PhotoHub is syncing the PayOS payment status. Please wait a moment.",
      successTitle: "Payment successful!",
      successSub: source === "subscription"
        ? "Your subscription is confirmed. The system will auto-generate recurring shoots for the selected plan."
        : "Your booking is confirmed. The payment is held securely and becomes withdrawable for the photographer after project completion.",
      pendingTitle: "Payment not confirmed yet",
      pendingSub: source === "subscription"
        ? "The subscription payment has not completed or PayOS has not confirmed it yet. You can return to the membership page and try again."
        : "The transaction has not completed or PayOS has not confirmed it yet. You can return to your bookings and try again.",
      failTitle: "Payment cancelled",
      failSub: source === "subscription"
        ? "The subscription payment was cancelled. You can subscribe again later."
        : "The transaction was cancelled. Your booking remains awaiting payment if the photographer accepted it.",
      orderCodeLabel: "Order code:",
      goBookingsBtn: source === "subscription" ? "Manage Subscriptions" : "Manage My Bookings",
      goHomeBtn: "Back to Home",
    },
  }[language];

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      if (!bookingId && !orderCode) {
        setChecking(false);
        setPaid(false);
        return;
      }
      setChecking(true);
      try {
        const loadSubscriptionStatus = () => subscriptionService.getPaymentStatus(orderCode);
        const loadBookingStatus = () => (
          bookingId
            ? bookingService.syncPaymentStatus(bookingId, orderCode, isCanceled)
            : bookingService.syncPaymentStatusByOrderCode(orderCode, isCanceled)
        );
        const res = source === "subscription" ? await loadSubscriptionStatus() : await loadBookingStatus();
        const isPaid = Boolean(res.data?.paid || res.data?.booking?.paymentStatus === "paid");
        if (!mounted) return;
        setPaid(isPaid);
        setMessage(res.data?.payosStatus || res.data?.paymentStatus || "");
        if (source === "subscription") {
          window.dispatchEvent(new Event("subscription_history_changed"));
        }
        if (source === "subscription" && isPaid) {
          triggerMembershipCelebration(res.data?.membershipTier || res.data?.tier || "Silver");
        }
      } catch (error) {
        const shouldRetryAsSubscription =
          Boolean(orderCode) &&
          source !== "subscription" &&
          (
            String(error?.response?.data?.message || error?.message || "").toLowerCase().includes("booking not found") ||
            String(error?.response?.data?.message || error?.message || "").toLowerCase().includes("not found") ||
            String(error?.response?.status || "") === "400"
          );

        if (shouldRetryAsSubscription) {
          try {
            const res = await subscriptionService.getPaymentStatus(orderCode);
            if (!mounted) return;
            const isPaid = Boolean(res.data?.paid || res.data?.subscriptionStatus === "ACTIVE");
            setPaid(isPaid);
            setMessage(res.data?.payosStatus || res.data?.paymentStatus || "");
            window.dispatchEvent(new Event("subscription_history_changed"));
            if (isPaid) {
              triggerMembershipCelebration(res.data?.membershipTier || res.data?.tier || "Silver");
            }
            setChecking(false);
            return;
          } catch (fallbackError) {
            if (!mounted) return;
            setPaid(false);
            setMessage(fallbackError.response?.data?.message || fallbackError.message);
            setChecking(false);
            return;
          }
        }
        if (!mounted) return;
        setPaid(false);
        setMessage(error.response?.data?.message || error.message);
        if (source === "subscription") {
          window.dispatchEvent(new Event("subscription_history_changed"));
        }
      } finally {
        if (mounted) setChecking(false);
      }
    };
    sync();
    return () => { mounted = false; };
  }, [bookingId, orderCode, isCanceled, source]);

  const state = checking ? "checking" : isCanceled ? "cancelled" : paid ? "success" : "pending";
  const isSuccess = state === "success";
  const isPending = state === "pending";
  const title = state === "checking" ? t.checkingTitle : isSuccess ? t.successTitle : isPending ? t.pendingTitle : t.failTitle;
  const sub = state === "checking" ? t.checkingSub : isSuccess ? t.successSub : isPending ? t.pendingSub : t.failSub;
  const cardBgClass = isDark ? "bg-[#0f172a]/85 border-white/10 shadow-2xl shadow-orange-500/5" : "bg-white border-slate-100 shadow-xl shadow-slate-100/50";
  const titleColor = checking ? "text-orange-500" : isSuccess ? "text-emerald-500" : isPending ? "text-amber-500" : "text-rose-500";

  return (
    <div className={`min-h-screen px-6 pb-16 pt-32 flex items-center justify-center transition-colors duration-500 ${isDark ? "bg-[#030303] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className={`relative w-full max-w-lg rounded-3xl border p-8 text-center backdrop-blur-md ${cardBgClass}`}>
        <div className={`absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 ${isSuccess ? "bg-emerald-500" : checking ? "bg-orange-500" : isPending ? "bg-amber-500" : "bg-rose-500"}`} />
        <div className="mb-6 flex justify-center">
          {checking ? <Loader2 size={72} className="animate-spin text-orange-500" /> : isSuccess ? <CheckCircle2 size={72} className="text-emerald-500" /> : <XCircle size={72} className={isPending ? "text-amber-500" : "text-rose-500"} />}
        </div>
        <h1 className={`mb-4 text-2xl font-black tracking-tight sm:text-3xl ${titleColor}`}>{title}</h1>
        <p className={`mb-6 text-sm font-medium leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{sub}</p>
        {message && !checking && <p className="mb-4 text-xs font-bold text-slate-500">{message}</p>}
        {orderCode && (
          <div className={`mb-8 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${isDark ? "border-white/5 bg-white/[0.02] text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
            <span>{t.orderCodeLabel}</span>
            <strong className={isDark ? "text-orange-400" : "font-extrabold text-orange-600"}>#{orderCode}</strong>
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button onClick={() => navigate(source === "subscription" ? "/subscriptions" : "/profile")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95 sm:w-auto">
            <Calendar size={16} />{t.goBookingsBtn}
          </button>
          <button onClick={() => navigate("/")} className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-bold transition sm:w-auto ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"}`}>
            <Home size={16} />{t.goHomeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
