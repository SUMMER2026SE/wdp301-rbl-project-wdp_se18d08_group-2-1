import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeInfo,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCcw,
  Ban,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";

const statusMap = {
  ACTIVE: { vi: "Đang hoạt động", en: "Active", icon: CheckCircle2, tone: "emerald" },
  PAUSED: { vi: "Đã tạm dừng", en: "Paused", icon: PauseCircle, tone: "amber" },
  PENDING_PAYMENT: { vi: "Chờ thanh toán", en: "Pending payment", icon: CreditCard, tone: "orange" },
  PENDING_CANCEL: { vi: "Chờ hủy", en: "Pending cancel", icon: Ban, tone: "rose" },
  CANCELLED: { vi: "Đã hủy", en: "Cancelled", icon: XCircle, tone: "slate" },
  EXPIRED: { vi: "Hết hạn", en: "Expired", icon: Clock3, tone: "slate" },
  RENEWING: { vi: "Đang gia hạn", en: "Renewing", icon: RefreshCcw, tone: "cyan" },
};

const paymentMap = {
  SUCCESS: { vi: "Đã thanh toán", en: "Paid", tone: "emerald" },
  PENDING: { vi: "Đang chờ", en: "Pending", tone: "orange" },
  FAILED: { vi: "Thất bại", en: "Failed", tone: "rose" },
  REFUNDED: { vi: "Đã hoàn tiền", en: "Refunded", tone: "cyan" },
};

const money = (value) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const resolveAvatar = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `http://localhost:3000${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const toneClass = (tone, dark) => {
  const map = {
    emerald: dark ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: dark ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200",
    orange: dark ? "bg-orange-500/10 text-orange-300 border-orange-500/20" : "bg-orange-50 text-orange-700 border-orange-200",
    rose: dark ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200",
    slate: dark ? "bg-white/5 text-slate-300 border-white/10" : "bg-slate-50 text-slate-600 border-slate-200",
    cyan: dark ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" : "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return map[tone] || map.slate;
};

export default function CustomerSubscriptionHistory({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState("");

  const t = useMemo(() => {
    const vi = {
      title: "Lịch sử gói tháng",
      subtitle: "Đăng ký, gia hạn, tạm dừng và hủy gói tháng của bạn sẽ hiện ở đây.",
      empty: "Bạn chưa có gói tháng nào.",
      refresh: "Tải lại",
      photographer: "Photographer",
      openPlan: "Mở gói",
      openHint: "Xem lại gói tháng của photographer này",
      amount: "Số tiền",
      timeline: "Thời gian",
      payment: "Thanh toán",
      lastPayment: "Lần thanh toán cuối",
      start: "Bắt đầu",
      end: "Kết thúc",
      loading: "Đang tải lịch sử gói tháng...",
      loadError: "Không tải được lịch sử gói tháng",
    };
    const en = {
      title: "Monthly plan history",
      subtitle: "Your registrations, renewals, pauses, and cancellations appear here.",
      empty: "You have no monthly plans yet.",
      refresh: "Refresh",
      photographer: "Photographer",
      openPlan: "Open plan",
      openHint: "View this photographer's monthly plan again",
      amount: "Amount",
      timeline: "Timeline",
      payment: "Payment",
      lastPayment: "Last payment",
      start: "Start",
      end: "End",
      loading: "Loading monthly plan history...",
      loadError: "Failed to load monthly plan history",
    };
    return language === "vi" ? vi : en;
  }, [language]);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await subscriptionService.getMySubscriptions();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSubscriptions(list);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    loadSubscriptions();
    const refresh = () => loadSubscriptions();
    window.addEventListener("subscription_history_changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("subscription_history_changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [loadSubscriptions]);

  const statusBadge = (status) => {
    const meta = statusMap[status] || { vi: status || "Unknown", en: status || "Unknown", icon: BadgeInfo, tone: "slate" };
    const Icon = meta.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass(meta.tone, isDark)}`}
      >
        <Icon size={11} />
        {meta[language] || meta.en}
      </span>
    );
  };

  const paymentBadge = (status) => {
    const meta = paymentMap[status] || { vi: status || "Unknown", en: status || "Unknown", tone: "slate" };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClass(meta.tone, isDark)}`}
      >
        {meta[language] || meta.en}
      </span>
    );
  };

  return (
    <section className={`rounded-2xl border p-4 md:p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white shadow-sm"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight md:text-xl">{t.title}</h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={loadSubscriptions}
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-2 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <RefreshCcw size={15} />
          {t.refresh}
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {t.loading}
          </div>
        ) : error ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-100 bg-red-50 text-red-700"}`}>
            {error}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-3">
            {subscriptions.map((item) => {
              const photographer = item.photographer?.user || item.photographer?.userId || item.photographer || {};
              const avatar = resolveAvatar(photographer.avatar);
              const packageName = item.package?.name || item.package?.title || item.package?.code || "Monthly plan";
              const photographerName = photographer.fullName || item.photographer?.displayName || photographer.email || t.photographer;
              const planLink = item.photographer?._id ? `/subscriptions?photographerId=${item.photographer._id}` : "/subscriptions";

              return (
                <article key={item._id} className={`rounded-[22px] border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/10">
                          {avatar ? (
                            <img src={avatar} alt={photographerName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-black text-orange-500">
                              {(photographerName || "P").charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-black md:text-lg">{packageName}</p>
                            {statusBadge(item.status)}
                          </div>
                          <p className={`mt-1 flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            <Camera size={14} className="text-orange-500" />
                            <span className="truncate">{photographerName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.amount}</span>
                          <span className="font-black text-orange-500">{money(item.amountPaid || item.amount || 0)} VNĐ</span>
                        </div>

                        <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.timeline}</span>
                          <span>{new Date(item.startDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span>{new Date(item.endDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
                        </div>

                        <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.payment}</span>
                          {paymentBadge(item.lastPaymentStatus)}
                        </div>
                      </div>

                      <div className={`mt-3 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${isDark ? "border-white/10 bg-white/[0.02] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        <Clock3 size={14} className="text-orange-500" />
                        <span className="font-semibold">{t.lastPayment}:</span>
                        <span>
                          {item.lastPaymentAt
                            ? new Date(item.lastPaymentAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                            : (language === "vi" ? "Chưa ghi nhận" : "Not recorded yet")}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-44">
                      <Link
                        to={planLink}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition hover:brightness-110"
                      >
                        {t.openPlan}
                        <ArrowRight size={16} />
                      </Link>
                      <div className={`rounded-2xl border px-3 py-2 text-xs leading-relaxed ${isDark ? "border-white/10 bg-white/[0.03] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        {t.openHint}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
