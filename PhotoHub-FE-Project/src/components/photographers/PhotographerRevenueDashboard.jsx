import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { DollarSign, CheckCircle, ArrowUpRight, ShieldAlert, TrendingUp, Landmark, RefreshCw } from "lucide-react";
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
      currency: "$",
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
      currency: "$",
    },
  }[language];

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await photographerMarketplaceService.getRevenue();
      setStats(res.data || {
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

  // Compute values for SVG Chart
  const monthlyData = stats.monthlyRevenue || [];
  const maxRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.revenue)) : 100;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className={`p-3 rounded-2xl border transition-all ${
            isDark ? "border-white/5 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
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
              className={`p-4 rounded-2xl border relative overflow-hidden flex items-center gap-4 ${
                isDark
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
                  ${stats.totalRevenue}
                </h3>
                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                  <CheckCircle size={10} className="text-emerald-500" />
                  {stats.completedBookings} {t.completedJobs}
                </span>
              </div>
            </div>

            {/* Withdrawn Stats Card */}
            <div
              className={`p-4 rounded-2xl border relative overflow-hidden flex items-center gap-4 ${
                isDark
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
                  ${stats.totalWithdrawn}
                </h3>
                {stats.pendingWithdrawn > 0 && (
                  <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1 mt-1">
                    <ShieldAlert size={10} />
                    {t.pendingWithdrawn}: ${stats.pendingWithdrawn}
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
                    ${stats.withdrawableAmount}
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
              <p className="mt-0.5 text-xl font-black text-amber-300">${stats.netWithdrawableAmount || 0}</p>
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-200 pt-3 dark:border-white/[0.04]">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Top revenue styles</p>
                {(stats.topStyles || []).slice(0, 3).map((item) => (
                  <div key={item.name} className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>{item.name}</span>
                    <span>${item.revenue}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Top packages</p>
                {(stats.topPackages || []).slice(0, 3).map((item) => (
                  <div key={item.name} className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>{item.name}</span>
                    <span>${item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? "bg-[#121214]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" />
              {t.chartTitle}
            </h3>

            {monthlyData.length === 0 ? (
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
                  {monthlyData.map((d, i) => {
                    const width = 30;
                    const spacing = 500 / monthlyData.length;
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
                          ${d.revenue}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-2 px-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="text-center flex-1">
                      {d.month}
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
