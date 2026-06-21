import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Check, X, FileText, Link as LinkIcon, Eye } from "lucide-react";
import Swal from "sweetalert2";
const API_URL = "http://localhost:3000";

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("PENDING"); // Mặc định lọc các hồ sơ PENDING
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, [verificationStatus, page]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPhotographerVerifications({
        verificationStatus,
        page,
        limit: 10
      });
      console.log("Fetched verifications:", res);
      if (res.success) {
        setVerifications(res.data.photographers || []);
        setTotalPages(res.data.pagination.pages);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải yêu cầu xác minh", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Phê duyệt hồ sơ?",
      text: "Xác nhận nhiếp ảnh gia này đủ điều kiện hoạt động và hiển thị trên sàn giao dịch.",
      icon: "question",
      input: "text",
      inputPlaceholder: "Ghi chú phê duyệt (tùy chọn)...",
      showCancelButton: true,
      confirmButtonText: "Phê duyệt",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.approvePhotographerVerification(id, result.value || "Hồ sơ hợp lệ");
        if (res.success) {
          Swal.fire("Thành công", "Đã duyệt hồ sơ nhiếp ảnh gia và gửi thông báo!", "success");
          fetchVerifications();
          setSelectedVerification(null);
        } else {
          Swal.fire("Thất bại", res.message || "Không thể duyệt", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Từ chối hồ sơ?",
      text: "Vui lòng cung cấp lý do từ chối cụ thể để gửi cho nhiếp ảnh gia.",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Lý do từ chối (bắt buộc)...",
      inputValidator: (value) => {
        if (!value) {
          return "Bạn phải nhập lý do từ chối!";
        }
      },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Từ chối hồ sơ",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.rejectPhotographerVerification(id, result.value);
        if (res.success) {
          Swal.fire("Đã từ chối", "Đã từ chối hồ sơ nhiếp ảnh gia và gửi phản hồi!", "success");
          fetchVerifications();
          setSelectedVerification(null);
        } else {
          Swal.fire("Thất bại", res.message || "Không thể từ chối", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Xác minh Nhiếp ảnh gia</h1>
        <p className="text-slate-400 text-sm mt-1">Phê duyệt hồ sơ hoạt động của nhiếp ảnh gia đối tác (Freelancer Photographer).</p>
      </div>

      {/* Filter tab status */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          { label: "Đang chờ duyệt", val: "PENDING" },
          { label: "Đã phê duyệt", val: "VERIFIED" },
          { label: "Đã từ chối", val: "REJECTED" }
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => { setVerificationStatus(tab.val); setPage(1); setSelectedVerification(null); }}
            className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${verificationStatus === tab.val
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-slate-400 hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Table of requests */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Nhiếp ảnh gia</th>
                <th className="py-3 px-3">Số CMND/CCCD</th>
                <th className="py-3 px-3">Ngày gửi yêu cầu</th>
                <th className="py-3 px-3 text-center rounded-r-xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500 mx-auto"></div>
                  </td>
                </tr>
              ) : verifications.length > 0 ? (
                verifications.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-800/10 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{v.displayName || "Nhiếp ảnh gia"}</div>
                      <div className="text-xs text-slate-500">{v.user?.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${v.verification?.status === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : v.verification?.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                          }`}
                      >
                        {v.verification?.documentType || "Chưa tải"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{new Date(v.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedVerification(v)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {v.verification?.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(v.verification?._id)}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
                              title="Phê duyệt"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleReject(v.verification?._id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                              title="Từ chối"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-500">Không có hồ sơ xác minh nào.</td>
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

        {/* Detail view panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">Chi tiết Hồ sơ xác minh</h2>

          {selectedVerification ? (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs">Họ tên thành viên:</span>
                <p className="text-white font-semibold text-base mt-0.5">
                  {selectedVerification.user?.fullName}
                </p>

                <p className="text-slate-500 text-xs">
                  {selectedVerification.user?.email}
                </p>

                <p className="text-slate-500 text-xs">
                  {selectedVerification.user?.phoneNumber}
                </p>
              </div>



              {/* ID Card Images */}
              <div className="space-y-2 pt-2">
                <span className="text-slate-400 text-xs">Ảnh giấy tờ CCCD/Passport:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                    <p className="text-[10px] text-slate-500 text-center py-1">Mặt trước</p>
                    <img
                      src={`${API_URL}${selectedVerification.verification?.documentFrontUrl}`}
                      alt="Front card"
                      className="w-full h-24 object-cover hover:scale-105 transition duration-300 cursor-pointer"
                      onClick={() => Swal.fire({ imageUrl: selectedVerification.verification?.documentFrontUrl, imageAlt: "Mặt trước CCCD", background: "#0f172a" })}
                    />
                  </div>
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                    <p className="text-[10px] text-slate-500 text-center py-1">Mặt sau</p>
                    <img
                      src={`${API_URL}${selectedVerification.verification?.documentBackUrl}`}
                      alt="Back card"
                      className="w-full h-24 object-cover hover:scale-105 transition duration-300 cursor-pointer"
                      onClick={() => Swal.fire({ imageUrl: selectedVerification.verification?.documentBackUrl, imageAlt: "Mặt sau CCCD", background: "#0f172a" })}
                    />
                  </div>
                </div>
              </div>

              {/* Portfolio Links */}
              {selectedVerification.portfolioLinks?.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs">Đường dẫn sản phẩm (Portfolio):</span>
                  <div className="space-y-1.5 mt-1">
                    {selectedVerification.portfolioLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-orange-400 hover:text-orange-300 hover:underline text-xs"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {selectedVerification.certificates?.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs">Chứng chỉ / Bằng cấp:</span>
                  <div className="space-y-1 mt-1">
                    {selectedVerification.certificates.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status and Review Info */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái duyệt:</span>
                  <span className={`font-semibold ${selectedVerification.verification?.status === "VERIFIED"
                    ? "text-emerald-400"
                    : selectedVerification.verification?.status === "REJECTED"
                      ? "text-red-400"
                      : "text-yellow-500"
                    }`}>{selectedVerification.verification?.status}</span>
                </div>
                {selectedVerification.verification?.status !== "PENDING" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Người duyệt:</span>
                      <span className="text-white font-medium">{selectedVerification.verification?.reviewedBy?.fullName || "Admin"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ghi chú duyệt:</span>
                      <p className="text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs mt-1 italic">
                        {selectedVerification.verification?.adminNote}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons if Pending */}
              {selectedVerification.verification?.status === "PENDING" && (
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <button
                    onClick={() => handleApprove(selectedVerification.verification._id)
                    }
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                  >
                    <Check className="h-4 w-4" />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => handleReject(selectedVerification.verification._id)}
                    className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 font-bold transition text-xs"
                  >
                    <X className="h-4 w-4" />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn biểu tượng con mắt ở danh sách để xem chi tiết hồ sơ.</p>
          )}
        </div>

      </div>

    </div>
  );
}
