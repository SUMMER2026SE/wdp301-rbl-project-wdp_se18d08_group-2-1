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

  // Tính chiều cao lớn nhất cho biểu đồ doanh thu tháng
  const maxRevenue = Math.max(...(stats.monthlyRevenueChart?.map(d => d.revenue) || [1000000]));

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
        
        {/* Doanh thu hàng tháng (SVG bar chart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Doanh thu hàng tháng
            </h2>
            <span className="text-xs text-slate-400">Giao dịch thành công (VNĐ)</span>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-slate-800">
            {stats.monthlyRevenueChart?.length > 0 ? (
              stats.monthlyRevenueChart.map((data, idx) => {
                const heightPercentage = (data.revenue / maxRevenue) * 85 + 5; // Min 5% to make bar visible
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-950 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-white text-center shadow-xl">
                      <p className="font-semibold text-orange-400">{formatCurrency(data.revenue)}</p>
                      <p className="text-slate-400 font-normal">{data.month}</p>
                    </div>

                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPercentage}%` }} 
                      className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-500 hover:from-orange-400 hover:to-orange-300 shadow-lg shadow-orange-500/10 cursor-pointer"
                    ></div>
                    
                    {/* Label */}
                    <span className="text-slate-500 text-[10px] mt-2 select-none truncate max-w-full">
                      {data.month.split("-")[1]}/{data.month.split("-")[0].slice(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                Chưa có dữ liệu doanh thu tháng.
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
