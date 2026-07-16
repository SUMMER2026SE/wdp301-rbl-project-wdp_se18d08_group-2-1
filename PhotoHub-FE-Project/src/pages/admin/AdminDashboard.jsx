import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import {
  Users,
  Camera,
  ShoppingBag,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  Award,
  ChevronRight
} from "lucide-react";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboardStatistics();
      if (res.success) {
        setStats(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải số liệu thống kê", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi kết nối", "Không thể kết nối đến máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (!stats) return <div className="text-slate-400 text-center">Không có dữ liệu thống kê.</div>;

  // Cấu hình các KPI Cards
  const cards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      sub: `${stats.totalCustomers} Khách hàng | ${stats.totalPhotographers} Photographer`,
      icon: Users,
      color: "from-blue-600/20 to-blue-500/5 border-blue-500/20 text-blue-400"
    },
    {
      title: "Nhiếp ảnh gia đã xác minh",
      value: stats.totalVerifiedPhotographers,
      sub: `Tỷ lệ xác minh: ${Math.round((stats.totalVerifiedPhotographers / (stats.totalPhotographers || 1)) * 100)}%`,
      icon: Camera,
      color: "from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Tổng số Booking",
      value: stats.totalBookings,
      sub: `${stats.completedBookings} Hoàn thành | ${stats.cancelledBookings} Đã hủy`,
      icon: ShoppingBag,
      color: "from-purple-600/20 to-purple-500/5 border-purple-500/20 text-purple-400"
    },
    {
      title: "Tổng Doanh thu",
      value: formatCurrency(stats.totalRevenue),
      sub: `Hoa hồng thu được: ${formatCurrency(stats.totalCommission)}`,
      icon: DollarSign,
      color: "from-orange-600/20 to-orange-500/5 border-orange-500/20 text-orange-400"
    }
  ];

  // Cấu hình SVG Line/Area Chart cho doanh thu hàng tháng theo dòng tiền (phóng to dòng tiền dù ít tiền)
  const rawChartData = stats.monthlyRevenueChart || [];
  
  // Tạo bản sao hoặc bổ sung dữ liệu
  const chartData = [...rawChartData];

  // Nếu dữ liệu rỗng hoặc ít hơn 6 tháng, tự động bù đắp các tháng trước đó để vẽ được đường dòng tiền liên tục
  if (chartData.length < 6) {
    const monthsToShow = 6;
    let baseDate = new Date();
    if (chartData.length > 0) {
      const lastMonthStr = chartData[chartData.length - 1].month; // YYYY-MM
      const [year, month] = lastMonthStr.split("-");
      baseDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    
    const filledChartData = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const realData = rawChartData.find(x => x.month === monthKey);
      filledChartData.push({
        month: monthKey,
        revenue: realData ? realData.revenue : 0
      });
    }
    chartData.splice(0, chartData.length, ...filledChartData);
  }

  const maxRevenueVal = Math.max(...chartData.map(d => d.revenue), 0) || 10;

  const svgWidth = 550;
  const svgHeight = 220;
  const paddingLeft = 75;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 50; // Tăng thêm để có không gian cho chữ xoay nghiêng

  const points = chartData.map((data, idx) => {
    const x = paddingLeft + (idx / Math.max(1, chartData.length - 1)) * (svgWidth - paddingLeft - paddingRight);
    const y = svgHeight - paddingBottom - (data.revenue / maxRevenueVal) * (svgHeight - paddingTop - paddingBottom);
    return { x, y, revenue: data.revenue, month: data.month, index: idx };
  });

  const linePath = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : "";

  const formatAbbreviated = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} Tr`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return `${num.toFixed(0)} đ`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Thống kê</h1>
          <p className="text-slate-400 mt-1">Tổng quan hoạt động kinh doanh và kiểm duyệt trên hệ thống PhotoHub.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold border border-slate-700 text-white transition duration-300"
        >
          Làm mới số liệu
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`rounded-2xl border p-6 bg-gradient-to-br ${card.color} backdrop-blur-md transition-all duration-300 hover:scale-[1.02]`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">{card.title}</span>
                <span className="p-2 rounded-lg bg-slate-950/40">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-white tracking-tight">{card.value}</span>
                <p className="text-xs text-slate-400 mt-1.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Doanh thu hàng tháng (SVG Area/Line Chart đại diện cho dòng tiền) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Sơ đồ biến động dòng tiền doanh thu
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Đơn vị: VNĐ</span>
            </div>

            {chartData.length > 0 ? (
              <div className="relative w-full pt-2">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines & Y-Axis Labels */}
                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const y = paddingTop + (svgHeight - paddingTop - paddingBottom) * (1 - ratio);
                    const labelVal = maxRevenueVal * ratio;
                    return (
                      <g key={idx} className="opacity-40">
                        <line 
                          x1={paddingLeft} 
                          y1={y} 
                          x2={svgWidth - paddingRight} 
                          y2={y} 
                          stroke="#334155" 
                          strokeDasharray="4 4" 
                          strokeWidth="1"
                        />
                        <text 
                          x={paddingLeft - 10} 
                          y={y + 4} 
                          fill="#94a3b8" 
                          fontSize="10" 
                          textAnchor="end" 
                          className="font-mono font-medium"
                        >
                          {formatAbbreviated(labelVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Main Line path (Green Cashflow) */}
                  <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Monthly Labels (X-Axis) - Tilted -25deg like the user's dashboard image */}
                  {points.map((p, idx) => {
                    const parts = p.month.split("-");
                    const label = `${parts[1]}/${parts[0].slice(2)}`;
                    return (
                      <text
                        key={idx}
                        x={p.x}
                        y={svgHeight - 15}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        transform={`rotate(-25, ${p.x}, ${svgHeight - 15})`}
                        className="font-semibold"
                      >
                        {label}
                      </text>
                    );
                  })}

                  {/* Data Points / Circles */}
                  {points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint === idx ? "7" : "4.5"}
                      fill="#020617"
                      stroke="#10b981"
                      strokeWidth={hoveredPoint === idx ? "3" : "2"}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>

                {/* Dynamic Tooltip */}
                {hoveredPoint !== null && points[hoveredPoint] && (
                  <div 
                    className="absolute bg-slate-950 border border-slate-800 text-white rounded-xl p-3 shadow-2xl z-20 pointer-events-none transition-all duration-150"
                    style={{
                      left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                      top: `${(points[hoveredPoint].y / svgHeight) * 100 - 15}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Tháng {points[hoveredPoint].month}</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5 text-center">{formatCurrency(points[hoveredPoint].revenue)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                Chưa có dữ liệu biến động dòng tiền doanh thu.
              </div>
            )}
          </div>
        </div>

        {/* Trạng thái Booking (Donut/Progress list) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-6">Trạng thái Lịch đặt</h2>
            <div className="space-y-4">
              {stats.bookingStatusChart?.map((item, idx) => {
                const percentage = stats.totalBookings > 0 ? (item.count / stats.totalBookings) * 100 : 0;
                let colorClass = "bg-orange-500";
                if (item.status === "COMPLETED") colorClass = "bg-emerald-500";
                if (item.status === "CANCELLED") colorClass = "bg-red-500";
                if (item.status === "DISPUTED") colorClass = "bg-orange-500";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">{item.status}</span>
                      <span className="text-white">{item.count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${percentage}%` }} className={`h-full rounded-full ${colorClass}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Chờ thanh toán cọc</span>
            <span className="flex items-center gap-1 font-bold text-yellow-500">
              <Clock className="h-3.5 w-3.5" />
              {stats.pendingWithdrawRequests} Yêu cầu rút tiền chờ duyệt
            </span>
          </div>
        </div>

      </div>

      {/* Top Photographers & Recent Activities */}
      <div className="grid grid-cols-1 gap-6">

        {/* Top Photographers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Nhiếp ảnh gia nổi bật
            </h2>
            <span className="text-xs text-slate-400">Dựa trên số lượt booking hoàn thành</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Nhiếp ảnh gia</th>
                  <th className="py-3 px-4">Địa phương</th>
                  <th className="py-3 px-4">Đánh giá trung bình</th>
                  <th className="py-3 px-4 text-center">Số booking hoàn tất</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Tổng thu nhập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.topPhotographers?.length > 0 ? (
                  stats.topPhotographers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition duration-200">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
                          {p.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{p.displayName}</div>
                          <div className="text-xs text-slate-500">{p.user?.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.location || "Chưa cập nhật"}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-yellow-500">★ {p.averageRating?.toFixed(1)}</span>
                        <span className="text-xs text-slate-500"> ({p.totalReviews} đánh giá)</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">{p.completedBookings}</td>
                      <td className="py-3 px-4 text-right font-bold text-orange-400">{formatCurrency(p.totalEarnings)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">Chưa có dữ liệu nhiếp ảnh gia tiêu biểu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
