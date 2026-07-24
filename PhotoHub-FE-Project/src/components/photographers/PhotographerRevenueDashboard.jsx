import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { DollarSign, CheckCircle, ArrowUpRight, ShieldAlert, TrendingUp, Landmark, RefreshCw, CalendarDays, BarChart3 } from "lucide-react";
import { photographerMarketplaceService } from "../../services/photographerService";

export default function PhotographerRevenueDashboard({ theme = "dark", language = "vi", onNavigateToWithdraw }) {
  const isDark = theme === "dark";
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedBookings: 0,
    totalWithdrawn: 0,
    pendingWithdrawn: 0,
    withdrawableAmount: 0,
    netWithdrawableAmount: 0,
    bidWinRate: 0,
    completionRate: 0,
    pendingPayout: 0,
    topStyles: [],
    topPackages: [],
    monthlyRevenue: [],
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("month");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const t = {
    vi: {
      title: "Báo Cáo Doanh Thu",
      totalEarnings: "Tổng doanh thu",
      completedJobs: "Lượt chụp hoàn thành",
      totalWithdrawn: "Đã rút thành công",
      pendingWithdrawn: "Đang xử lý rút",
      withdrawable: "Khả dụng rút tiền",
      withdrawBtn: "Rút tiền ngay",
      chartTitle: "Tăng Trưởng Doanh Thu Theo Tháng",
      noChartData: "Chưa có dữ liệu tăng trưởng",
      error: "Đã xảy ra lỗi",
      currency: "đ",
    },
    en: {
      title: "Revenue Dashboard",
      totalEarnings: "Total Earnings",
      completedJobs: "Completed Bookings",
      totalWithdrawn: "Successfully Withdrawn",
      pendingWithdrawn: "Pending Withdrawal",
      withdrawable: "Available to Withdraw",
      withdrawBtn: "Withdraw Now",
      chartTitle: "Monthly Revenue Growth",
      noChartData: "No billing data available",
      error: "An error occurred",
      currency: "đ",
    },
  }[language];

  const fetchStats = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const res = await photographerMarketplaceService.getRevenue(nextFilters);

      setStats(
        res.data || {
          totalRevenue: 0,
          completedBookings: 0,
          totalWithdrawn: 0,
          pendingWithdrawn: 0,
          withdrawableAmount: 0,
          netWithdrawableAmount: 0,
          bidWinRate: 0,
          completionRate: 0,
          pendingPayout: 0,
          topStyles: [],
          topPackages: [],
          monthlyRevenue: [],
        }
      );
    } catch (err) {
      console.error(err);
      Swal.fire(t.error, err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const applyQuickRange = (days) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);
    const nextFilters = {
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    };
    setFilterType("day");
    setFilters(nextFilters);
    fetchStats(nextFilters);
  };

  const resetFilters = () => {
    const nextFilters = { startDate: "", endDate: "" };
    setFilters(nextFilters);
    setFilterType("month");
    fetchStats(nextFilters);
  };

  // Compute values for SVG Chart
  const chartData = filterType === "day" ? (stats.dailyRevenue || []) : (stats.monthlyRevenue || []);
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue)) : 100;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
        </div>
        <button
          onClick={() => fetchStats()}
          disabled={loading}
          className={`p-3 rounded-2xl border transition-all ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
            }`}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Revenue Filter */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap gap-3 items-end justify-between ${isDark
            ? "bg-[#121214]/60 border-white/[0.06]"
            : "bg-white border-slate-200"
          }`}
      >
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <BarChart3 size={18} />
          </span>
          <div>
            <p className="text-sm font-black">{language === "vi" ? "Bộ lọc doanh thu" : "Revenue filters"}</p>
            <p className="text-xs text-slate-500">{language === "vi" ? "Xem cột theo ngày hoặc theo tháng." : "View bars by day or by month."}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className={`flex rounded-xl border p-1 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
            {[
              { key: "day", label: language === "vi" ? "Theo ngày" : "Daily" },
              { key: "month", label: language === "vi" ? "Theo tháng" : "Monthly" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilterType(item.key)}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${filterType === item.key
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-orange-600"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">From</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className={`h-11 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-white/10 bg-black/20 text-white" : "border-slate-200 bg-white text-slate-900"}`}
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">To</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className={`h-11 rounded-xl border px-3 text-sm outline-none ${isDark ? "border-white/10 bg-black/20 text-white" : "border-slate-200 bg-white text-slate-900"}`}
            />
          </label>
          <button type="button" onClick={() => applyQuickRange(7)} className={`h-11 rounded-xl border px-3 text-xs font-bold transition ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:border-orange-300"}`}>7 ngày</button>
          <button type="button" onClick={() => applyQuickRange(30)} className={`h-11 rounded-xl border px-3 text-xs font-bold transition ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:border-orange-300"}`}>30 ngày</button>
          <button type="button" onClick={() => fetchStats()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition hover:bg-orange-600">
            <CalendarDays size={15} />
            Apply
          </button>
          <button type="button" onClick={resetFilters} className="h-11 rounded-xl bg-slate-500 px-4 text-sm font-bold text-white transition hover:bg-slate-600">
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Earnings Card */}
            <div
              className={`p-4 rounded-2xl border relative overflow-hidden flex items-center gap-4 ${isDark
                ? "bg-[#121214]/80 border-white/[0.06] shadow-xl"
                : "bg-white border-slate-200 shadow-md"
                }`}
            >
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t.totalEarnings}
                </p> 
                <h3 className="text-xl font-black mt-0.5">
                  {Number(stats.totalRevenue || 0).toLocaleString('vi-VN')} đ
                </h3>
                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                  <CheckCircle size={10} className="text-emerald-500" />
                  {stats.completedBookings} {t.completedJobs}
                </span>
              </div>
            </div>

            {/* Withdrawn Stats Card */}
            <div
              className={`p-4 rounded-2xl border relative overflow-hidden flex items-center gap-4 ${isDark
                ? "bg-[#121214]/80 border-white/[0.06] shadow-xl"
                : "bg-white border-slate-200 shadow-md"
                }`}
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Landmark size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t.totalWithdrawn}
                </p>
                <h3 className="text-xl font-black mt-0.5">
                  {Number(stats.totalWithdrawn || 0).toLocaleString('vi-VN')} đ
                </h3>
                {stats.pendingWithdrawn > 0 && (
                  <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1 mt-1">
                    <ShieldAlert size={10} />
                    {t.pendingWithdrawn}: {Number(stats.pendingWithdrawn || 0).toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>
            </div>

            {/* Balance to Withdraw Card */}
            <div
              className={`p-4 rounded-2xl border relative overflow-hidden bg-gradient-to-tr from-orange-500/10 via-amber-500/[0.02] to-transparent border-orange-500/20 shadow-md shadow-orange-500/5`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t.withdrawable}
                  </p>
                  <h3 className="text-2xl font-black text-orange-500 mt-0.5">
                    {Number(stats.withdrawableAmount || 0).toLocaleString('vi-VN')} đ
                  </h3>
                </div>
                {onNavigateToWithdraw && stats.withdrawableAmount > 0 && (
                  <button
                    onClick={onNavigateToWithdraw}
                    className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-sm shadow-orange-500/10 active:scale-[0.95]"
                  >
                    <span>{t.withdrawBtn}</span>
                    <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3.5 rounded-2xl border p-4 ${isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid win rate</p>
              <p className="mt-0.5 text-xl font-black text-emerald-500">{stats.bidWinRate || 0}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completion rate</p>
              <p className="mt-0.5 text-xl font-black text-orange-500">{stats.completionRate || 0}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net payout after commission</p>
              <p className="mt-0.5 text-xl font-black text-amber-300">{Number(stats.netWithdrawableAmount || 0).toLocaleString("vi-VN")} đ</p>
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-200 pt-3 dark:border-white/[0.04]">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Top revenue styles</p>
                {(stats.topStyles || []).slice(0, 3).map((item) => (
                  <div key={item.name} className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>{item.name}</span>
                    <span>{Number(item.revenue || 0).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Top packages</p>
                {(stats.topPackages || []).slice(0, 3).map((item) => (
                  <div key={item.name} className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>{item.name}</span>
                    <span>{Number(item.revenue || 0).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div
            className={`p-4 rounded-2xl border ${isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
              }`}
          >
            <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" />
              {t.chartTitle}
            </h3>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500">
                <p className="text-xs font-semibold">{t.noChartData}</p>
              </div>
            ) : (
              <div className="relative h-64 w-full">
                {/* Custom SVG Bar Chart */}
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="500" y2="50" className="stroke-slate-200 dark:stroke-white/[0.02]" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" className="stroke-slate-200 dark:stroke-white/[0.02]" strokeWidth="1" />
                  <line x1="0" y1="150" x2="500" y2="150" className="stroke-slate-200 dark:stroke-white/[0.02]" strokeWidth="1" />

                  {/* Bars */}
                  {chartData.map((d, i) => {
                    const width = 30;
                    const spacing = 500 / chartData.length;
                    const x = i * spacing + (spacing - width) / 2;
                    const barHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * 150 : 0;
                    const y = 170 - barHeight;

                    return (
                      <g key={i} className="group cursor-pointer">
                        {/* Gradient definition per bar */}
                        <defs>
                          <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ff6b3b" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>

                        {/* Hover Tooltip display background logic in SVG */}
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={barHeight}
                          fill={`url(#grad-${i})`}
                          rx="4"
                          className="transition-all duration-300 hover:brightness-125"
                        />
                        {/* Values label */}
                        <text
                          x={x + width / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fill={isDark ? "#fff" : "#000"}
                          fontSize="8"
                          fontWeight="bold"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {Number(d.revenue || 0).toLocaleString('vi-VN')}đ
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-2 px-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {chartData.map((d, i) => (
                    <div key={i} className="text-center flex-1">
                      {filterType === "day" ? (d.day || "").slice(5) : d.month}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
