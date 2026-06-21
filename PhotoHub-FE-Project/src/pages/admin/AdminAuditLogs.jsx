import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { ClipboardList, Search, Eye, Filter, Calendar } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [admin, setAdmin] = useState("");
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        page,
        limit: 10,
        admin,
        actionType,
        startDate,
        endDate
      });
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pagination?.pages || 1);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải nhật ký hoạt động", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setAdmin("");
    setActionType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    // Fetch logs immediately after resetting state
    setTimeout(() => fetchLogs(), 100);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-cyan-400" />
          Nhật ký Hoạt động Quản trị (Admin Audit Logs)
        </h1>
        <p className="text-slate-400 text-sm mt-1">Truy vết toàn bộ các thao tác chỉnh sửa cấu hình, phê duyệt và xử lý tranh chấp của quản trị viên.</p>
      </div>

      {/* Filter panel form */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 flex items-center gap-1"><Search className="h-3 w-3" /> Mã Admin (ID):</label>
          <input
            type="text"
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            placeholder="Nhập ID Admin..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 flex items-center gap-1"><Filter className="h-3 w-3" /> Loại thao tác:</label>
          <input
            type="text"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            placeholder="APPROVE_WITHDRAW, LOCK_USER..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition"
          >
            Lọc kết quả
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table of logs */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Admin</th>
                <th className="py-3 px-3">Loại Thao tác</th>
                <th className="py-3 px-3">Mục tiêu (Target)</th>
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-800/10 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-white">{l.admin?.fullName || "Quản trị viên"}</div>
                      <div className="text-xs text-slate-500">{l.admin?.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/20 text-cyan-400 text-[10px] font-bold border border-cyan-800/30">
                        {l.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-xs">
                      <div>{l.targetType}</div>
                      <div className="font-mono text-[10px] text-slate-600">{l.targetId}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-xs">
                      {new Date(l.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Không tìm thấy nhật ký audit logs nào.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500">Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Trước
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* JSON Details side panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">Chi tiết Metadata</h2>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500">ID log:</span>
                <p className="text-white font-mono">{selectedLog._id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">IP thực hiện:</span>
                <p className="text-slate-300 font-mono">{selectedLog.ipAddress || "Localhost/Unknown"}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-slate-500 block">Dữ liệu chi tiết (JSON):</span>
                <pre className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-[10px] text-cyan-400 overflow-x-auto max-h-96">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn biểu tượng con mắt ở danh sách để xem dữ liệu JSON chi tiết.</p>
          )}
        </div>
      </div>
    </div>
  );
}
