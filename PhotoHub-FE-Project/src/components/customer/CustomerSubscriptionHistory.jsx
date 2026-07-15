import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Camera, CheckCircle2, Clock3, CreditCard, RefreshCcw, XCircle, PauseCircle, Ban, ArrowRight, BadgeInfo } from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";

const statusMap = {
  ACTIVE: {
    label: { vi: "Đang hoạt động", en: "Active" },
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
  PAUSED: {
    label: { vi: "Đã tạm dừng", en: "Paused" },
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: PauseCircle,
  },
  PENDING_PAYMENT: {
    label: { vi: "Chờ thanh toán", en: "Pending payment" },
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: CreditCard,
  },
  PENDING_CANCEL: {
    label: { vi: "Chờ hủy", en: "Pending cancel" },
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: Ban,
  },
  CANCELLED: {
    label: { vi: "Đã hủy", en: "Cancelled" },
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    icon: XCircle,
  },
  EXPIRED: {
    label: { vi: "Hết hạn", en: "Expired" },
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    icon: Clock3,
  },
  RENEWING: {
    label: { vi: "Đang gia hạn", en: "Renewing" },
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: RefreshCcw,
  },
};

const paymentMap = {
  SUCCESS: {
    label: { vi: "Đã thanh toán", en: "Paid" },
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  PENDING: {
    label: { vi: "Đang chờ", en: "Pending" },
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  FAILED: {
    label: { vi: "Thất bại", en: "Failed" },
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  REFUNDED: {
    label: { vi: "Đã hoàn tiền", en: "Refunded" },
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  },
};

const formatMoney = (value) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const resolveAvatar = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `http://localhost:3000${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

export default function CustomerSubscriptionHistory({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState("");

  const t = useMemo(() => ({
    vi: {
      title: "Lịch sử gói tháng",
      subtitle: "Đăng ký, gia hạn, tạm dừng và hủy gói tháng của bạn sẽ hiển thị ở đây.",
      empty: "Bạn chưa có gói tháng nào.",
      photographer: "Photographer",
      package: "Gói",
      amount: "Số tiền",
      dates: "Thời gian",
      payment: "Thanh toán",
      openPlan: "Mở gói",
      openPlanHint: "Xem lại gói tháng của photographer này",
      start: "Bắt đầu",
      end: "Kết thúc",
      lastPayment: "Lần thanh toán cuối",
    },
    en: {
      title: "Monthly plan history",
      subtitle: "Your plan purchases, renewals, pauses, and cancellations appear here.",
      empty: "You have no monthly plans yet.",
      photographer: "Photographer",
      package: "Plan",
      amount: "Amount",
      dates: "Timeline",
      payment: "Payment",
      openPlan: "Open plan",
      openPlanHint: "View this photographer's monthly plan again",
      start: "Start",
      end: "End",
      lastPayment: "Last payment",
    },
  }[language] || {
    title: "Monthly plan history",
    subtitle: "Your plan purchases, renewals, pauses, and cancellations appear here.",
    empty: "You have no monthly plans yet.",
    photographer: "Photographer",
    package: "Plan",
    amount: "Amount",
    dates: "Timeline",
    payment: "Payment",
    openPlan: "Open plan",
    openPlanHint: "View this photographer's monthly plan again",
    start: "Start",
    end: "End",
    lastPayment: "Last payment",
  }), [language]);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await subscriptionService.getMySubscriptions();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSubscriptions(list);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();

    const refresh = () => loadSubscriptions();
    window.addEventListener("subscription_history_changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("subscription_history_changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const statusBadge = (status) => {
    const meta = statusMap[status] || {
      label: { vi: status || "Unknown", en: status || "Unknown" },
      className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      icon: BadgeInfo,
    };
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.className}`}>
        <Icon size={11} />
        {meta.label[language] || meta.label.en}
      </span>
    );
  };

  const paymentBadge = (status) => {
    const meta = paymentMap[status] || {
      label: { vi: status || "Unknown", en: status || "Unknown" },
      className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${meta.className}`}>
        {meta.label[language] || meta.label.en}
      </span>
    );
  };

  return (
    <div className={`rounded-3xl border p-6 transition-all ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white shadow-sm"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight">{t.title}</h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={loadSubscriptions}
          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <RefreshCcw size={16} />
          {language === "vi" ? "Tải lại" : "Refresh"}
        </button>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {language === "vi" ? "Đang tải lịch sử gói tháng..." : "Loading monthly plan history..."}
          </div>
        ) : error ? (
          <div className={`rounded-2xl border p-4 text-sm ${isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-100 bg-red-50 text-red-700"}`}>
            {error}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-4">
            {subscriptions.map((item) => {
              const photographer = item.photographer?.user || item.photographer?.userId || item.photographer || {};
              const avatar = resolveAvatar(photographer.avatar);
              const packageName = item.package?.name || item.package?.title || item.package?.code || t.package;
              const photographerName = photographer.fullName || item.photographer?.displayName || photographer.email || t.photographer;
              const planLink = item.photographer?._id ? `/subscriptions?photographerId=${item.photographer._id}` : "/subscriptions";

              return (
                <div key={item._id} className={`rounded-[28px] border p-5 shadow-sm transition ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/10 shrink-0">
                        {avatar ? (
                          <img src={avatar} alt={photographerName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-black text-orange-500">
                            {(photographerName || "P").charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-black">{packageName}</p>
                          {statusBadge(item.status)}
                        </div>

                        <p className={`mt-1 flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          <Camera size={14} className="text-orange-500" />
                          <span className="truncate">{photographerName}</span>
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{t.amount}</div>
                            <div className="mt-1 text-sm font-black text-orange-600">{formatMoney(item.amountPaid || item.amount || 0)} VNĐ</div>
                          </div>

                          <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{t.dates}</div>
                            <div className="mt-1 text-sm font-semibold">
                              <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-orange-500" />
                                {new Date(item.startDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                              </div>
                              <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {language === "vi" ? `${t.end}: ` : `${t.end}: `}
                                {new Date(item.endDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                              </div>
                            </div>
                          </div>

                          <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{t.payment}</div>
                            <div className="mt-2">{paymentBadge(item.lastPaymentStatus)}</div>
                          </div>
                        </div>

                        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-white/10 bg-white/[0.02] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                          <div className="flex items-center gap-2 font-bold">
                            <Clock3 size={14} className="text-orange-500" />
                            {t.lastPayment}
                          </div>
                          <p className="mt-1 text-xs">
                            {item.lastPaymentAt
                              ? new Date(item.lastPaymentAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                              : (language === "vi" ? "Chưa ghi nhận" : "Not recorded yet")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:w-52">
                      <Link
                        to={planLink}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110"
                      >
                        {t.openPlan}
                        <ArrowRight size={16} />
                      </Link>
                      <div className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${isDark ? "border-white/10 bg-white/[0.03] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        {t.openPlanHint}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
