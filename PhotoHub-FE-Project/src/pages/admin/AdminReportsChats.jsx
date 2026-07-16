import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { MessageSquare, ShieldAlert, Check, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminReportsChats() {
  const [activeTab, setActiveTab] = useState("reports"); // reports or chats

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("PENDING");
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);

  // Chats state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    } else {
      fetchChatMessages();
    }
  }, [activeTab, reportStatus, reportPage, chatPage]);

  const fetchReports = async () => {
    try {
      const res = await adminService.getReports({
        status: reportStatus,
        page: reportPage,
        limit: 10
      });
      if (res.success) {
        setReports(res.data.reports);
        setReportTotalPages(res.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await adminService.getChatMessages({
        scamDetected: "true",
        page: chatPage,
        limit: 15
      });
      if (res.success) {
        setChatMessages(res.data.messages);
        setChatTotalPages(res.data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Giải quyết báo cáo vi phạm
  const handleResolveReport = async (reportId) => {
    const { value: formValues } = await Swal.fire({
      title: "Giải quyết báo cáo vi phạm",
      html:
        '<input id="swal-resolution" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mb-4" placeholder="Ghi nhận hướng xử lý (bắt buộc)..."/>' +
        '<div class="flex items-center gap-2 text-slate-300 text-xs">' +
        '  <input id="swal-block-user" type="checkbox" class="h-4 w-4 rounded bg-slate-900 border-slate-800 accent-orange-500" />' +
        '  <label for="swal-block-user" class="font-semibold text-red-400">Đồng thời khóa tài khoản bị báo cáo này</label>' +
        "</div>",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Giải quyết",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc",
      preConfirm: () => {
        return {
          resolution: document.getElementById("swal-resolution").value,
          blockUser: document.getElementById("swal-block-user").checked
        };
      }
    });

    if (formValues) {
      if (!formValues.resolution) {
        Swal.fire("Lỗi", "Vui lòng nhập hướng xử lý báo cáo!", "error");
        return;
      }
      try {
        const res = await adminService.resolveReport(reportId, formValues.resolution, formValues.blockUser);
        if (res.success) {
          Swal.fire("Thành công", "Đã lưu kết quả xử lý báo cáo vi phạm!", "success");
          fetchReports();
          setSelectedReport(null);
        } else {
          Swal.fire("Lỗi", res.message || "Xử lý thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Từ chối báo cáo vi phạm
  const handleRejectReport = async (reportId) => {
    const result = await Swal.fire({
      title: "Bác bỏ báo cáo vi phạm?",
      text: "Xác nhận báo cáo vi phạm không có căn cứ hoặc sai lệch.",
      input: "text",
      inputPlaceholder: "Ghi chú bác bỏ báo cáo...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Bác bỏ",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.rejectReport(reportId, result.value || "Báo cáo không đủ bằng chứng vi phạm");
        if (res.success) {
          Swal.fire("Đã đóng", "Đã bác bỏ báo cáo vi phạm thành công!", "success");
          fetchReports();
          setSelectedReport(null);
        } else {
          Swal.fire("Lỗi", res.message || "Bác bỏ thất bại", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
      }
    }
  };

  // Ẩn tin nhắn chat
  const handleHideMessage = async (msgId) => {
    try {
      const res = await adminService.hideChatMessage(msgId);
      if (res.success) {
        Swal.fire("Đã ẩn", "Tin nhắn vi phạm đã bị ẩn khỏi luồng chat!", "success");
        fetchChatMessages();
      }
    } catch (e) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  // Hiện lại tin nhắn chat
  const handleUnhideMessage = async (msgId) => {
    try {
      const res = await adminService.unhideChatMessage(msgId);
      if (res.success) {
        Swal.fire("Đã mở lại", "Đã khôi phục hiển thị tin nhắn!", "success");
        fetchChatMessages();
      }
    } catch (e) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Kiểm duyệt Cộng đồng & Tin nhắn</h1>
        <p className="text-slate-400 text-sm mt-1">Xử lý báo cáo vi phạm tài khoản và kiểm duyệt tin nhắn bị AI/Regex đánh dấu có dấu hiệu scam hoặc lộ thông tin ngoài sàn.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("reports")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
            activeTab === "reports"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Báo cáo vi phạm
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
            activeTab === "chats"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Kiểm duyệt Tin nhắn Scam
        </button>
      </div>

      {/* Reports Panel */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Table reports */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-medium">Lọc theo trạng thái báo cáo:</span>
              <select 
                value={reportStatus} 
                onChange={(e) => { setReportStatus(e.target.value); setReportPage(1); setSelectedReport(null); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chưa xử lý (PENDING)</option>
                <option value="REVIEWING">Đang xem xét (REVIEWING)</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                <option value="REJECTED">Đã bác bỏ (REJECTED)</option>
              </select>
            </div>

            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 rounded-l-xl">Người tố cáo</th>
                  <th className="py-3 px-3">Bên bị báo cáo</th>
                  <th className="py-3 px-3">Phân loại</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-center rounded-r-xl">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.length > 0 ? (
                  reports.map((r) => {
                    let badgeColor = "text-yellow-500 bg-yellow-500/10";
                    if (r.status === "RESOLVED") badgeColor = "text-emerald-400 bg-emerald-500/10";
                    if (r.status === "REJECTED") badgeColor = "text-slate-400 bg-slate-500/20";

                    return (
                      <tr key={r._id} className="hover:bg-slate-800/10 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{r.reporter?.fullName}</div>
                          <div className="text-[11px] text-slate-500">{r.reporter?.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{r.reportedUser?.fullName}</div>
                          <div className="text-[11px] text-slate-500">{r.reportedUser?.email}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-xs">{r.targetType}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">Không tìm thấy báo cáo nào.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {reportTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">Trang {reportPage} / {reportTotalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={reportPage === 1}
                    onClick={() => setReportPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    Trước
                  </button>
                  <button
                    disabled={reportPage === reportTotalPages}
                    onClick={() => setReportPage(p => Math.min(reportTotalPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel detail report */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Chi tiết vi phạm
            </h2>

            {selectedReport ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Người báo cáo:</span>
                  <p className="text-white font-semibold">{selectedReport.reporter?.fullName}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Người bị tố cáo:</span>
                  <p className="text-white font-semibold">{selectedReport.reportedUser?.fullName} 
                    {selectedReport.reportedUser?.isBlocked && (
                      <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full">Đã bị Khóa</span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-xl space-y-1">
                  <span className="text-red-400 font-bold text-xs">Lý do báo cáo:</span>
                  <p className="text-white font-semibold">{selectedReport.reason}</p>
                  <p className="text-slate-300 text-xs italic">"Chi tiết: {selectedReport.details || "Không mô tả thêm"}"</p>
                </div>

                <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loại vi phạm:</span>
                    <span className="text-white font-mono">{selectedReport.targetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID Đối tượng vi phạm:</span>
                    <span className="text-slate-400 font-mono">{selectedReport.targetId}</span>
                  </div>
                </div>

                {/* Actions resolve / reject */}
                {selectedReport.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <button
                      onClick={() => handleResolveReport(selectedReport._id)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                    >
                      <Check className="h-4 w-4" />
                      Giải quyết
                    </button>
                    <button
                      onClick={() => handleRejectReport(selectedReport._id)}
                      className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                  </div>
                )}

                {selectedReport.status !== "PENDING" && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-400">Trạng thái xử lý:</span>
                      <span className={selectedReport.status === "RESOLVED" ? "text-emerald-400" : "text-slate-400"}>{selectedReport.status}</span>
                    </div>
                    <p className="text-slate-400 mt-1 italic">Kết luận: "{selectedReport.resolution}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-12">Chọn nút "Chi tiết" ở báo cáo để xem thông tin xử lý.</p>
            )}
          </div>
        </div>
      )}

      {/* Chats moderation Panel */}
      {activeTab === "chats" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Danh sách tin nhắn bị hệ thống đánh dấu nghi ngờ giao dịch ngoài luồng:</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 rounded-l-xl">Người gửi</th>
                  <th className="py-3 px-3">Người nhận</th>
                  <th className="py-3 px-3">Nội dung tin nhắn</th>
                  <th className="py-3 px-3">Hành vi đánh dấu</th>
                  <th className="py-3 px-3 text-center rounded-r-xl">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <tr key={msg._id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{msg.sender?.fullName}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{msg.sender?.role}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{msg.receiver?.fullName}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{msg.receiver?.role}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className={`text-slate-300 text-xs italic ${msg.isHidden ? "line-through text-slate-600" : ""}`}>
                          "{msg.message}"
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                          <AlertTriangle className="h-3 w-3" />
                          Lộ thông tin liên lạc
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {msg.isHidden ? (
                          <button
                            onClick={() => handleUnhideMessage(msg._id)}
                            className="flex items-center justify-center gap-1 mx-auto px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold transition border border-emerald-500/20"
                          >
                            <Eye className="h-3 w-3" />
                            Hiển thị lại
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHideMessage(msg._id)}
                            className="flex items-center justify-center gap-1 mx-auto px-2.5 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded text-xs font-bold transition border border-red-500/20"
                          >
                            <EyeOff className="h-3 w-3" />
                            Ẩn tin nhắn
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">Không tìm thấy tin nhắn vi phạm nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {chatTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500">Trang {chatPage} / {chatTotalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={chatPage === 1}
                  onClick={() => setChatPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Trước
                </button>
                <button
                  disabled={chatPage === chatTotalPages}
                  onClick={() => setChatPage(p => Math.min(chatTotalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
