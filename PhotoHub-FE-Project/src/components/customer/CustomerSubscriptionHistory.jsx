import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeInfo,
  Camera,
  CheckCircle2,
  CalendarDays,
  Clock3,
  CreditCard,
  RefreshCcw,
  Ban,
  PauseCircle,
  Plus,
  Save,
  Sparkles,
  XCircle,
  Trash2,
  X,
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
  return `https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const dayOptions = [
  { value: 0, label: "CN" },
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
];

const normalizePreferredSchedule = (schedule = []) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return [{ dayOfWeek: 5, startTime: "09:00", endTime: "12:00", note: "" }];
  }

  return schedule.map((item) => ({
    dayOfWeek: Number(item?.dayOfWeek ?? 5),
    startTime: String(item?.startTime || "09:00"),
    endTime: String(item?.endTime || "12:00"),
    note: String(item?.note || ""),
  }));
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [preferredSchedule, setPreferredSchedule] = useState([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

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
      contract: "Hợp đồng tháng",
      contractHint: "Xem draft lịch chụp và chọn khung giờ ưu tiên cho chu kỳ hiện tại.",
      draftSessions: "Buổi chụp nháp",
      preferredSchedule: "Khung giờ ưu tiên",
      note: "Ghi chú",
      notePlaceholder: "Ví dụ: muốn chụp chậm hơn, chú ý góc sáng, nhắc trước khi chụp...",
      addSlot: "Thêm khung",
      saveSchedule: "Lưu lịch ưu tiên",
      openContract: "Mở hợp đồng",
      chooseHint: "Chọn ngày và khung giờ mong muốn để hệ thống sinh lại draft phù hợp hơn.",
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
      contract: "Monthly contract",
      contractHint: "Review draft shoots and choose preferred slots for the current cycle.",
      draftSessions: "Draft sessions",
      preferredSchedule: "Preferred slots",
      note: "Note",
      notePlaceholder: "For example: slower pace, focus on lighting, remind me before the shoot...",
      addSlot: "Add slot",
      saveSchedule: "Save preferred schedule",
      openContract: "Open contract",
      chooseHint: "Choose your preferred day and time, then regenerate the draft schedule.",
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

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedSubscription(null);
    setPreferredSchedule([]);
    setDetailError("");
  }, []);

  const openSubscriptionDetail = useCallback(async (item) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedSubscription(item);
    try {
      const res = await subscriptionService.getSubscriptionById(item._id);
      const detail = res?.data || res;
      setSelectedSubscription(detail?.subscription || detail || item);
      setPreferredSchedule(normalizePreferredSchedule(detail?.subscription?.preferredSchedule || detail?.preferredSchedule || item?.preferredSchedule || []));
    } catch (err) {
      setDetailError(err?.response?.data?.message || err.message || "Failed to load subscription detail");
      setPreferredSchedule(normalizePreferredSchedule(item?.preferredSchedule || []));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const updateSlot = useCallback((index, field, value) => {
    setPreferredSchedule((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, [field]: value } : slot)));
  }, []);

  const addSlot = useCallback(() => {
    setPreferredSchedule((prev) => [...prev, { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", note: "" }]);
  }, []);

  const removeSlot = useCallback((index) => {
    setPreferredSchedule((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const selectedSubscriptionId = selectedSubscription?._id;

  const savePreferredSchedule = useCallback(async () => {
    if (!selectedSubscriptionId) return;
    setSavingSchedule(true);
    try {
      const res = await subscriptionService.updatePreferredSchedule(selectedSubscriptionId, preferredSchedule);
      const payload = res?.data || res;
      const refreshedId = payload?.subscription?._id || payload?._id || selectedSubscriptionId;
      if (refreshedId) {
        const detailRes = await subscriptionService.getSubscriptionById(refreshedId);
        const detail = detailRes?.data || detailRes;
        setSelectedSubscription(detail?.subscription || detail || { _id: selectedSubscriptionId });
        setPreferredSchedule(normalizePreferredSchedule(detail?.subscription?.preferredSchedule || detail?.preferredSchedule || preferredSchedule));
      }
      await loadSubscriptions();
      window.dispatchEvent(new Event("subscription_history_changed"));
    } catch (err) {
      setDetailError(err?.response?.data?.message || err.message || "Failed to save preferred schedule");
    } finally {
      setSavingSchedule(false);
    }
  }, [loadSubscriptions, preferredSchedule, selectedSubscriptionId]);

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

  const filteredSubscriptions = useMemo(() => {
    if (statusFilter === "ALL") return subscriptions;
    if (statusFilter === "PAID") {
      return subscriptions.filter((item) => String(item.lastPaymentStatus || "").toUpperCase() === "SUCCESS" || Number(item.amountPaid || 0) > 0);
    }
    if (statusFilter === "PENDING_PAYMENT") {
      return subscriptions.filter((item) => String(item.lastPaymentStatus || "").toUpperCase() === "PENDING");
    }
    return subscriptions.filter((item) => String(item.status || "").toUpperCase() === statusFilter);
  }, [statusFilter, subscriptions]);

  const filterOptions = [
    { value: "ALL", label: language === "vi" ? "Tất cả" : "All" },
    { value: "PAID", label: language === "vi" ? "Đã thanh toán" : "Paid" },
    { value: "PENDING_PAYMENT", label: language === "vi" ? "Chờ thanh toán" : "Pending" },
    { value: "ACTIVE", label: language === "vi" ? "Đang hoạt động" : "Active" },
    { value: "PAUSED", label: language === "vi" ? "Tạm dừng" : "Paused" },
    { value: "PENDING_CANCEL", label: language === "vi" ? "Chờ hủy" : "Pending cancel" },
    { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
    { value: "EXPIRED", label: language === "vi" ? "Hết hạn" : "Expired" },
  ];

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

      <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-1">
        {filterOptions.map((option) => {
          const active = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${active
                  ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : isDark
                    ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300 hover:text-orange-600"
                }`}
            >
              {option.label}
            </button>
          );
        })}
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
        ) : filteredSubscriptions.length === 0 ? (
          <div className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSubscriptions.map((item) => {
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
                          <span className="font-black text-orange-500">{money(item.lastPaymentAmount || item.package?.monthlyPrice || item.amountPaid || item.amount || 0)} VNĐ</span>
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
                      <button
                        type="button"
                        onClick={() => openSubscriptionDetail(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition hover:brightness-110"
                      >
                        <Sparkles size={16} />
                        {t.openContract}
                      </button>
                      <Link
                        to={planLink}
                        className={`inline-flex items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-center text-xs leading-relaxed transition ${isDark ? "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/5" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-300 hover:text-orange-600"}`}
                      >
                        <ArrowRight size={12} />
                        {t.openHint}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showDetailModal && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 px-4 py-4 backdrop-blur-sm">
          <div
            className={`flex w-full max-w-6xl max-h-[88vh] flex-col overflow-hidden rounded-[28px] border shadow-2xl ${isDark ? "border-white/10 bg-[#09111f] text-white" : "border-slate-200 bg-white text-slate-900"
              }`}
          >
            <div className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">{t.contract}</p>
                <h3 className="mt-1 text-2xl font-black">
                  {selectedSubscription?.package?.name || selectedSubscription?.package?.title || selectedSubscription?.package?.code || "Monthly plan"}
                </h3>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.contractHint}</p>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">Loading...</div>
              ) : detailError ? (
                <div className="px-5 py-12 text-center text-sm text-rose-500">{detailError}</div>
              ) : (
                <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className={`rounded-[22px] border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(selectedSubscription?.status)}
                        {paymentBadge(selectedSubscription?.lastPaymentStatus)}
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? "border-orange-500/20 bg-orange-500/10 text-orange-300" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
                          {selectedSubscription?.remainingSessions?.remainingSessions ?? selectedSubscription?.remainingSessions ?? 0} sessions left
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.amount}</p>
                          <p className="mt-1 text-lg font-black text-orange-500">{money(selectedSubscription?.lastPaymentAmount || selectedSubscription?.package?.monthlyPrice || selectedSubscription?.amountPaid || 0)} VNĐ</p>
                        </div>
                        <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.timeline}</p>
                          <p className="mt-1 text-sm font-bold">
                            {selectedSubscription?.startDate ? new Date(selectedSubscription.startDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"} → {selectedSubscription?.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                          </p>
                        </div>
                        <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.lastPayment}</p>
                          <p className="mt-1 text-sm font-bold">
                            {selectedSubscription?.lastPaymentAt ? new Date(selectedSubscription.lastPaymentAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : (language === "vi" ? "Chưa ghi nhận" : "Not recorded")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-[22px] border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">{t.draftSessions}</p>
                          <h4 className="mt-1 text-lg font-black">{t.contract}</h4>
                        </div>
                        <CalendarDays size={18} className="text-orange-500" />
                      </div>

                      <div className="mt-4 grid gap-3">
                        {Array.isArray(selectedSubscription?.bookingSchedule) && selectedSubscription.bookingSchedule.length > 0 ? (
                          selectedSubscription.bookingSchedule.map((cycle) => (
                            <div key={cycle._id || cycle.cycleIndex} className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-black">Cycle {cycle.cycleIndex + 1}</p>
                                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                    {cycle.cycleStart ? new Date(cycle.cycleStart).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"} → {cycle.cycleEnd ? new Date(cycle.cycleEnd).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                                  </p>
                                </div>
                                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                                  {cycle.generatedSessions || 0}/{cycle.totalSessions || 0}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2">
                                {(cycle.sessions || []).length > 0 ? (
                                  cycle.sessions.map((session) => (
                                    <div key={session._id || `${cycle.cycleIndex}-${session.sessionNumber}`} className={`rounded-2xl border px-3 py-2 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"}`}>
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-bold">
                                            Buổi {session.sessionNumber}
                                          </p>
                                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                            {session.scheduledStart ? new Date(session.scheduledStart).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "-"} → {session.scheduledEnd ? new Date(session.scheduledEnd).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                                          </p>
                                        </div>
                                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass(String(session.status || "").toUpperCase() === "NEED_RESCHEDULE" ? "rose" : String(session.status || "").toUpperCase() === "DRAFT" ? "amber" : "emerald", isDark)}`}>
                                          {String(session.status || "DRAFT")}
                                        </span>
                                      </div>
                                      {session.conflictReason && (
                                        <p className={`mt-2 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>{session.conflictReason}</p>
                                      )}
                                      {session.note && (
                                        <div className={`mt-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${isDark ? "border-white/10 bg-white/[0.02] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                          <span className="mr-1 font-black uppercase tracking-[0.14em] text-orange-500">{t.note}:</span>
                                          {session.note}
                                        </div>
                                      )}
                                      {Array.isArray(session.suggestedSlots) && session.suggestedSlots.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {session.suggestedSlots.map((slot, index) => (
                                            <span key={`${session.sessionNumber}-${index}`} className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${isDark ? "border-white/10 bg-white/[0.03] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
                                              {slot.start ? new Date(slot.start).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className={`rounded-2xl border border-dashed px-4 py-5 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                                    {language === "vi" ? "Chưa có draft nào được sinh cho chu kỳ này." : "No draft sessions generated for this cycle yet."}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`rounded-2xl border border-dashed px-4 py-5 text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                            {language === "vi" ? "Chưa có lịch nháp." : "No draft schedule yet."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-[22px] border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">{t.preferredSchedule}</p>
                        <h4 className="mt-1 text-lg font-black">{t.chooseHint}</h4>
                      </div>
                      <Sparkles size={18} className="text-orange-500" />
                    </div>

                    <div className="mt-4 space-y-3">
                      {preferredSchedule.map((slot, index) => (
                        <div key={`${index}-${slot.dayOfWeek}`} className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Day</span>
                              <select
                                value={slot.dayOfWeek}
                                onChange={(e) => updateSlot(index, "dayOfWeek", Number(e.target.value))}
                                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-[#09111f] text-white" : "border-slate-200 bg-white text-slate-900"}`}
                              >
                                {dayOptions.map((day) => (
                                  <option key={day.value} value={day.value}>{language === "vi" ? `Thứ ${day.value === 0 ? "CN" : day.value + 1}` : day.label}</option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Start</span>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-[#09111f] text-white" : "border-slate-200 bg-white text-slate-900"}`}
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">End</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-[#09111f] text-white" : "border-slate-200 bg-white text-slate-900"}`}
                              />
                            </label>
                          </div>
                          <label className="mt-2 block">
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.note}</span>
                            <textarea
                              rows={2}
                              value={slot.note || ""}
                              onChange={(e) => updateSlot(index, "note", e.target.value)}
                              placeholder={t.notePlaceholder}
                              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? "border-white/10 bg-[#09111f] text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"}`}
                            />
                          </label>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeSlot(index)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-500 transition hover:bg-rose-500 hover:text-white"
                            >
                              <Trash2 size={11} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addSlot}
                        className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3.5 py-2 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white"
                      >
                        <Plus size={15} />
                        {t.addSlot}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={savePreferredSchedule}
                      disabled={savingSchedule}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={15} />
                      {savingSchedule ? (language === "vi" ? "Đang lưu..." : "Saving...") : t.saveSchedule}
                    </button>

                    <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs leading-relaxed ${isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
                      {language === "vi"
                        ? "Khi bạn lưu khung giờ ưu tiên, hệ thống sẽ sinh lại draft của chu kỳ hiện tại theo khung mới."
                        : "Saving preferred slots will rebuild the current cycle draft sessions using the new timing preferences."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
