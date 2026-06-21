import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Star, Award, ShieldAlert, Zap, Percent, Clock, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminPhotographerAudit() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPhotographerPerformance();
      if (res.success) {
        setData(res.data);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải đánh giá hiệu quả", "error");
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
            <Star className="h-6 w-6 text-yellow-400" />
            Đánh giá Hiệu quả Photographer (Performance Audit)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Phân tích chuyên sâu về tỷ lệ hủy, khiếu nại, trễ hạn bàn giao và tốc độ phản hồi tin nhắn của đối tác.</p>
        </div>
        <button
          onClick={fetchPerformance}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-sm"
        >
          Tải lại số liệu
        </button>
      </div>

      {/* Photographer performance table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 rounded-l-xl">Photographer</th>
              <th className="py-3 px-3 text-center">Sao Đánh giá</th>
              <th className="py-3 px-3 text-center">Tỷ lệ Hoàn thành</th>
              <th className="py-3 px-3 text-center">Bàn giao Trễ</th>
              <th className="py-3 px-3 text-center">Khiếu nại (Disputes)</th>
              <th className="py-3 px-3 text-center">Phản hồi (Giờ)</th>
              <th className="py-3 px-3 rounded-r-xl text-center">Xếp hạng</th>
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
                  <td className="py-4 px-3">
                    <div className="font-semibold text-white">{item.photographer?.displayName}</div>
                    <div className="text-xs text-slate-500">{item.photographer?.user?.email}</div>
                  </td>
                  <td className="py-4 px-3 text-center font-bold text-yellow-400">
                    <div className="flex items-center justify-center gap-1">
                      <span>{item.averageRating}</span>
                      <Star className="h-3 w-3 fill-yellow-500 stroke-none" />
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center font-bold text-slate-200">
                    <div className="flex items-center justify-center gap-1">
                      <Percent className="h-3 w-3 text-cyan-400" />
                      <span>{item.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center font-bold text-amber-400">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{item.lateDeliveryRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center font-bold text-rose-400">
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      <span>{item.disputeRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3 text-cyan-500" />
                      <span>{item.responseTime}h</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.rank === "Top Photographer"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.rank === "Warning Photographer"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500">Không tìm thấy nhiếp ảnh gia nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
