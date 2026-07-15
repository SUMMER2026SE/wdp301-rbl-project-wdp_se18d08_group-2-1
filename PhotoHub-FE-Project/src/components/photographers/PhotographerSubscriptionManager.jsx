import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { CircleDollarSign, PauseCircle, PlayCircle, RotateCcw, Shield, User, ArrowRight } from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";

const statusTone = {
  ACTIVE: "emerald",
  PAUSED: "amber",
  PENDING_PAYMENT: "orange",
  PENDING_CANCEL: "rose",
  CANCELLED: "slate",
  EXPIRED: "slate",
  RENEWING: "cyan",
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

const money = (value) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const avatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `http://localhost:3000${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

export default function PhotographerSubscriptionManager({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const t = useMemo(() => {
    const vi = {
      title: "Quản lý gói tháng",
      subtitle: "Xem khách đã mua gói, trạng thái thanh toán và điều khiển từng gói ngay tại đây.",
      empty: "Hiện chưa có gói tháng nào.",
      refresh: "Tải lại",
      total: "Tổng gói",
      active: "Đang hoạt động",
      paused: "Đã tạm dừng",
      pending: "Chờ thanh toán",
      revenue: "Doanh thu gói tháng",
      customer: "Khách hàng",
      amount: "Số tiền",
      timeline: "Thời gian",
      session: "Buổi/tháng",
      remaining: "Buổi còn lại",
      payment: "Thanh toán",
      openPlan: "Mở trang gói",
      pause: "Tạm dừng",
      resume: "Khôi phục",
      confirmPause: "Tạm dừng gói này 30 ngày?",
      confirmResume: "Khôi phục gói này?",
      actionError: "Không thể xử lý gói tháng",
    };
    const en = {
      title: "Monthly plan manager",
      subtitle: "Review customers, payment status, and manage each monthly plan from here.",
      empty: "No monthly plans yet.",
      refresh: "Refresh",
      total: "Total plans",
      active: "Active",
      paused: "Paused",
      pending: "Pending payment",
      revenue: "Monthly plan revenue",
      customer: "Customer",
      amount: "Amount",
      timeline: "Timeline",
      session: "Sessions/month",
      remaining: "Remaining",
      payment: "Payment",
      openPlan: "Open plan page",
      pause: "Pause",
      resume: "Resume",
      confirmPause: "Pause this plan for 30 days?",
      confirmResume: "Resume this plan?",
      actionError: "Could not manage the monthly plan",
    };
    return language === "vi" ? vi : en;
  }, [language]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getMySubscriptions();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSubscriptions(list);
    } catch (_error) {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    const refresh = () => loadSubscriptions();
    window.addEventListener("subscription_changed", refresh);
    window.addEventListener("subscription_history_changed", refresh);
    return () => {
      window.removeEventListener("subscription_changed", refresh);
      window.removeEventListener("subscription_history_changed", refresh);
    };
  }, []);

  const emitRefresh = () => {
    window.dispatchEvent(new Event("subscription_changed"));
    window.dispatchEvent(new Event("subscription_history_changed"));
  };

  const handleAction = async (id, action) => {
    setBusyId(id);
    try {
      if (action === "pause") {
        const result = await Swal.fire({
          title: t.pause,
          text: t.confirmPause,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: language === "vi" ? "Tạm dừng" : "Pause",
          cancelButtonText: language === "vi" ? "Hủy" : "Cancel",
        });
        if (!result.isConfirmed) return;
        await subscriptionService.pauseSubscription(id, 30);
      }

      if (action === "resume") {
        const result = await Swal.fire({
          title: t.resume,
          text: t.confirmResume,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: language === "vi" ? "Khôi phục" : "Resume",
          cancelButtonText: language === "vi" ? "Hủy" : "Cancel",
        });
        if (!result.isConfirmed) return;
        await subscriptionService.resumeSubscription(id);
      }

      await loadSubscriptions();
      emitRefresh();
      Swal.fire({
        icon: "success",
        title: language === "vi" ? "Thành công" : "Done",
        text: language === "vi" ? "Gói tháng đã được cập nhật." : "Monthly plan updated.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: language === "vi" ? "Lỗi" : "Error",
        text: error?.response?.data?.message || error.message || t.actionError,
      });
    } finally {
      setBusyId("");
    }
  };

  const summary = useMemo(() => {
    const active = subscriptions.filter((item) => item.status === "ACTIVE").length;
    const paused = subscriptions.filter((item) => item.status === "PAUSED").length;
    const pending = subscriptions.filter((item) => item.status === "PENDING_PAYMENT").length;
    const revenue = subscriptions.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
    return { total: subscriptions.length, active, paused, pending, revenue };
  }, [subscriptions]);

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
    <section className={`rounded-3xl border p-5 md:p-6 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white shadow-sm"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.subtitle}</p>
        </div>
        <button
          onClick={loadSubscriptions}
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-2 text-sm font-bold text-orange-600 transition hover:border-orange-400 hover:bg-orange-500 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <RotateCcw size={15} />
          {t.refresh}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {[
          { label: t.total, value: summary.total, icon: CircleDollarSign },
          { label: t.active, value: summary.active, icon: PlayCircle },
          { label: t.paused, value: summary.paused, icon: PauseCircle },
          { label: t.revenue, value: `${money(summary.revenue)} VNĐ`, icon: Shield },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <item.icon size={12} />
              {item.label}
            </div>
            <div className="mt-1 text-lg font-black">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-1">
        {filterOptions.map((option) => {
          const active = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                active
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

      <div className="mt-5">
        {loading ? (
          <div className={`rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {language === "vi" ? "Đang tải gói tháng..." : "Loading monthly plans..."}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className={`rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubscriptions.map((item) => {
              const customer = item.customer || {};
              const customerAvatar = avatarUrl(customer.avatar);
              const status = item.status || "PENDING_PAYMENT";
              const tone = statusTone[status] || "slate";
              const remainingSessions = Math.max(0, Number(item.sessionsPerMonth || 0) - Number(item.usedSessions || 0));
              const start = item.startDate ? new Date(item.startDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-";
              const end = item.endDate ? new Date(item.endDate).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-";

              return (
                <article key={item._id} className={`rounded-[24px] border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/10">
                        {customerAvatar ? (
                          <img src={customerAvatar} alt={customer.fullName || customer.email || "customer"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-black text-orange-500">
                            {(customer.fullName || customer.email || "C").charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black">{item.package?.name || item.package?.title || "Monthly plan"}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass(tone, isDark)}`}>
                            {status}
                          </span>
                        </div>
                        <p className={`mt-1 flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          <User size={14} className="text-orange-500" />
                          <span className="truncate">{customer.fullName || customer.email || t.customer}</span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className={`rounded-full border px-3 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.amount}</span>
                            <span className="font-black text-orange-500">{money(item.amountPaid || item.package?.monthlyPrice || 0)} VNĐ</span>
                          </div>
                          <div className={`rounded-full border px-3 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.timeline}</span>
                            <span>{start}</span>
                            <span className="mx-1 text-slate-400">→</span>
                            <span>{end}</span>
                          </div>
                          <div className={`rounded-full border px-3 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.session}</span>
                            <span className="font-semibold">{item.sessionsPerMonth || 1}</span>
                          </div>
                          <div className={`rounded-full border px-3 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.remaining}</span>
                            <span className="font-semibold text-emerald-500">{remainingSessions}</span>
                          </div>
                          <div className={`rounded-full border px-3 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span className="mr-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">{t.payment}</span>
                            <span className="font-semibold">{item.lastPaymentStatus || "PENDING"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-48">
                      <Link
                        to={`/subscriptions?photographerId=${item.photographer?._id || ""}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition hover:brightness-110"
                      >
                        {t.openPlan}
                        <ArrowRight size={16} />
                      </Link>
                      {status === "ACTIVE" && (
                        <button
                          disabled={busyId === item._id}
                          onClick={() => handleAction(item._id, "pause")}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-600 transition hover:bg-amber-500 hover:text-white dark:border-amber-500/20 dark:text-amber-300"
                        >
                          <PauseCircle size={15} />
                          {t.pause}
                        </button>
                      )}
                      {status === "PAUSED" && (
                        <button
                          disabled={busyId === item._id}
                          onClick={() => handleAction(item._id, "resume")}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-600 transition hover:bg-emerald-500 hover:text-white dark:border-emerald-500/20 dark:text-emerald-300"
                        >
                          <PlayCircle size={15} />
                          {t.resume}
                        </button>
                      )}
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
