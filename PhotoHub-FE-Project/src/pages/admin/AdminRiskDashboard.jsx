import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { AlertOctagon, Users, Camera, Calendar, DollarSign, Activity } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminRiskDashboard() {
  const [data, setData] = useState({
    riskyUsers: [],
    riskyPhotographers: [],
    riskyBookings: [],
    riskyPayments: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getRiskDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải dữ liệu giám sát rủi ro", "error");
      }
    } catch (err) {
      console.error(err);
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
            <AlertOctagon className="h-6 w-6 text-rose-500 animate-pulse" />
            Giám sát Rủi ro Hệ thống
          </h1>
          <p className="text-slate-400 text-sm mt-1">Phát hiện và cảnh báo các hành vi, giao dịch, và tài khoản có dấu hiệu bất thường.</p>
        </div>
        <button
          onClick={fetchRiskData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-sm"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {/* Stats overview card grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Khách hàng rủi ro", val: data.riskyUsers?.length || 0, icon: Users, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Photographer rủi ro", val: data.riskyPhotographers?.length || 0, icon: Camera, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
          { label: "Lịch chụp rủi ro", val: data.riskyBookings?.length || 0, icon: Calendar, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
          { label: "Giao dịch rủi ro", val: data.riskyPayments?.length || 0, icon: DollarSign, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`p-5 rounded-2xl border backdrop-blur-md transition hover:-translate-y-0.5 ${item.color}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black mt-2 text-white">{item.val}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          { label: "Khách hàng", key: "users" },
          { label: "Photographers", key: "photographers" },
          { label: "Lịch đặt chụp", key: "bookings" },
          { label: "Hoàn tiền & Giao dịch", key: "payments" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
              activeTab === tab.key
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content lists */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500 mx-auto"></div>
          </div>
        ) : (
          <div>
            {activeTab === "users" && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">Thành viên</th>
                    <th className="py-3 px-3 text-center">Số lượng tranh chấp</th>
                    <th className="py-3 px-3 text-center">Số lượng hủy lịch</th>
                    <th className="py-3 px-3 rounded-r-xl">Mức độ cảnh báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.riskyUsers?.length > 0 ? (
                    data.riskyUsers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10 transition">
                        <td className="py-4 px-3 flex items-center gap-3">
                          <img src={item.user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} alt="" className="h-8 w-8 rounded-full border border-slate-700 object-cover" />
                          <div>
                            <div className="font-semibold text-white">{item.user.fullName || "Khách hàng"}</div>
                            <div className="text-xs text-slate-500">{item.user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center font-bold text-rose-400">{item.disputesCount}</td>
                        <td className="py-4 px-3 text-center font-bold text-amber-400">{item.cancellationsCount}</td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.disputesCount > 5 || item.cancellationsCount > 8 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {item.disputesCount > 5 || item.cancellationsCount > 8 ? "High Risk" : "Watchlist"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-500">Hệ thống chưa ghi nhận tài khoản khách hàng rủi ro nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "photographers" && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">Photographer</th>
                    <th className="py-3 px-3 text-center">Tỷ lệ Tranh chấp</th>
                    <th className="py-3 px-3 text-center">Tỷ lệ Hoàn thành</th>
                    <th className="py-3 px-3 text-center">Số đơn</th>
                    <th className="py-3 px-3 rounded-r-xl">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.riskyPhotographers?.length > 0 ? (
                    data.riskyPhotographers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10 transition">
                        <td className="py-4 px-3">
                          <div className="font-semibold text-white">{item.photographer.displayName}</div>
                          <div className="text-xs text-slate-500">{item.photographer.user?.email}</div>
                        </td>
                        <td className="py-4 px-3 text-center font-bold text-rose-400">{(item.discutableRate || item.disputeRate * 100).toFixed(0)}%</td>
                        <td className="py-4 px-3 text-center font-bold text-yellow-400">{(item.completionRate * 100).toFixed(0)}%</td>
                        <td className="py-4 px-3 text-center text-slate-400">{item.totalBookings}</td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.completionRate < 0.5 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {item.completionRate < 0.5 ? "High Risk" : "Watchlist"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">Chưa phát hiện nhiếp ảnh gia rủi ro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "bookings" && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">Mã Booking</th>
                    <th className="py-3 px-3">Khách hàng</th>
                    <th className="py-3 px-3">Photographer</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 rounded-r-xl">Cảnh báo rủi ro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.riskyBookings?.length > 0 ? (
                    data.riskyBookings.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10 transition">
                        <td className="py-4 px-3 font-mono text-xs text-white">{item._id}</td>
                        <td className="py-4 px-3">
                          <div className="font-semibold text-slate-200">{item.customer?.fullName}</div>
                          <div className="text-xs text-slate-500">{item.customer?.email}</div>
                        </td>
                        <td className="py-4 px-3">
                          <div className="font-semibold text-slate-200">{item.photographer?.displayName || "N/A"}</div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">{item.status}</span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="text-xs text-rose-400 font-semibold">
                            {item.status === "DISPUTED" ? "⚠️ Đang bị tranh chấp khiếu nại" : "⏰ Trễ giao Album ảnh"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">Chưa ghi nhận lịch đặt rủi ro nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "payments" && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">Giao dịch</th>
                    <th className="py-3 px-3">Kiểu giao dịch</th>
                    <th className="py-3 px-3">Bên Gửi</th>
                    <th className="py-3 px-3">Bên Nhận</th>
                    <th className="py-3 px-3 text-center">Số tiền</th>
                    <th className="py-3 px-3 rounded-r-xl text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.riskyPayments?.length > 0 ? (
                    data.riskyPayments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10 transition">
                        <td className="py-4 px-3">
                          <div className="font-semibold text-white">{item.transactionId || "N/A"}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {item._id}</div>
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.paymentType === "REFUND" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-400"}`}>
                            {item.paymentType}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-slate-300">{item.sender?.fullName || "Hệ thống"}</td>
                        <td className="py-4 px-3 text-slate-300">{item.receiver?.fullName || "Hệ thống"}</td>
                        <td className="py-4 px-3 text-center text-cyan-400 font-bold">{formatCurrency(item.amount)}</td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">Không có giao dịch rủi ro/hoàn tiền nào ghi nhận.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
