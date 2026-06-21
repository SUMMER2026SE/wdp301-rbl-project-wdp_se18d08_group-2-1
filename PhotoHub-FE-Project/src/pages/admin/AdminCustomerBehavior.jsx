import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Activity, ShieldAlert, AlertTriangle, UserCheck, Search, Users } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminCustomerBehavior() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBehavior();
  }, []);

  const fetchBehavior = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomerBehavior();
      if (res.success) {
        setData(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải phân tích hành vi khách hàng", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            Giám sát Hành vi Khách hàng (Customer Behavior)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Phát hiện sớm các khách hàng spam đặt lịch ảo, hủy lịch thường xuyên, hoặc lạm dụng cơ chế tranh chấp.</p>
        </div>
        <button
          onClick={fetchBehavior}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-sm"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {/* Customer behavior table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 rounded-l-xl">Khách hàng</th>
              <th className="py-3 px-3 text-center">Tổng số Lịch đặt</th>
              <th className="py-3 px-3 text-center">Số lượt Hủy lịch</th>
              <th className="py-3 px-3 text-center">Số khiếu nại (Disputes)</th>
              <th className="py-3 px-3 text-center">Lịch mới (7 ngày)</th>
              <th className="py-3 px-3 text-center">Điểm Rủi ro (Risk Score)</th>
              <th className="py-3 px-3 rounded-r-xl text-center">Trạng thái ví / tài khoản</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto"></div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/10 transition">
                  <td className="py-4 px-3 flex items-center gap-3">
                    <img src={item.customer.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} alt="" className="h-8 w-8 rounded-full border border-slate-700 object-cover" />
                    <div>
                      <div className="font-semibold text-white">{item.customer.fullName || "Khách hàng"}</div>
                      <div className="text-xs text-slate-500 font-mono text-[10px]">{item.customer._id}</div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center text-slate-200">{item.totalBookings}</td>
                  <td className="py-4 px-3 text-center font-bold text-amber-400">{item.cancellations}</td>
                  <td className="py-4 px-3 text-center font-bold text-rose-400">{item.disputes}</td>
                  <td className="py-4 px-3 text-center text-slate-400">{item.spamBookings}</td>
                  <td className="py-4 px-3 text-center font-black">
                    <span className={item.riskScore >= 70 ? "text-rose-500" : item.riskScore >= 35 ? "text-amber-500" : "text-emerald-500"}>
                      {item.riskScore} / 100
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === "HIGH_RISK"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : item.status === "WATCHLIST"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500">Chưa ghi nhận khách hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
