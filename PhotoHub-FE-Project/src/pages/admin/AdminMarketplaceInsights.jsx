import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { TrendingUp, Camera, MapPin, Layers, Award } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminMarketplaceInsights() {
  const [insights, setInsights] = useState({
    topBookingStyles: [],
    topLocations: [],
    bestSellingPackages: [],
    fastestGrowingPhotographers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await adminService.getMarketplaceInsights();
      if (res.success) {
        setInsights(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải số liệu thị trường", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-cyan-400" />
            AI & Xu hướng Thị trường (Marketplace Insights)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Phân tích chuyên sâu về phong cách chụp, địa điểm phổ biến, và những đối tác tăng trưởng mạnh nhất.</p>
        </div>
        <button
          onClick={fetchInsights}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-sm"
        >
          Cập nhật số liệu
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-3">Đang tổng hợp dữ liệu giao dịch...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Booking Styles */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Phong cách chụp phổ biến
            </h2>
            <div className="space-y-3">
              {insights.topBookingStyles?.length > 0 ? (
                insights.topBookingStyles.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-200 capitalize">{item._id}</span>
                    <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-bold">{item.count} lịch đặt</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">Chưa có dữ liệu phong cách chụp.</p>
              )}
            </div>
          </div>

          {/* Top Locations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Địa điểm đặt chụp nhiều nhất
            </h2>
            <div className="space-y-3">
              {insights.topLocations?.length > 0 ? (
                insights.topLocations.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-200">{item._id}</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">{item.count} booking</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">Chưa có dữ liệu địa điểm.</p>
              )}
            </div>
          </div>

          {/* Best Selling Packages */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" />
              Gói chụp dịch vụ bán chạy nhất
            </h2>
            <div className="space-y-3">
              {insights.bestSellingPackages?.length > 0 ? (
                insights.bestSellingPackages.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-200">{item._id}</span>
                    <span className="px-2.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-xs font-bold">{item.count} lượt đặt</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">Chưa có dữ liệu gói chụp.</p>
              )}
            </div>
          </div>

          {/* Fastest Growing Photographers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Camera className="h-4 w-4 text-rose-400" />
              Photographers tăng trưởng mạnh nhất (30 ngày gần đây)
            </h2>
            <div className="space-y-3">
              {insights.fastestGrowingPhotographers?.length > 0 ? (
                insights.fastestGrowingPhotographers.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <div className="font-bold text-slate-200">{item._id?.displayName}</div>
                      <div className="text-[11px] text-slate-500">{item._id?.user?.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-400">{item.bookingsCount} lịch hoàn thành</div>
                      <div className="text-[10px] text-slate-400">Doanh thu: {formatCurrency(item.earnings)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-6">Chưa có số liệu nhiếp ảnh gia tăng trưởng.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
