import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Tag, Plus, Edit2, Trash2, Calendar, Percent, Check, X } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminCampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [page]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCampaigns({ page, limit: 10 });
      if (res.success) {
        setCampaigns(res.data.campaigns || []);
        setTotalPages(res.data.pagination?.pages || 1);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải danh sách chiến dịch", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDiscountPercent(10);
    setStartDate("");
    setEndDate("");
    setStatus("ACTIVE");
    setShowModal(true);
  };

  const openEditModal = (camp) => {
    setEditingId(camp._id);
    setTitle(camp.title);
    setDescription(camp.description);
    setDiscountPercent(camp.discountPercent);
    setStartDate(camp.startDate ? camp.startDate.split("T")[0] : "");
    setEndDate(camp.endDate ? camp.endDate.split("T")[0] : "");
    setStatus(camp.status);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      Swal.fire("Lỗi", "Vui lòng nhập đầy đủ Tiêu đề, Ngày bắt đầu và Ngày kết thúc!", "warning");
      return;
    }

    const payload = {
      title,
      description,
      discountPercent: parseInt(discountPercent) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status
    };

    try {
      let res;
      if (editingId) {
        res = await adminService.updateCampaign(editingId, payload);
      } else {
        res = await adminService.createCampaign(payload);
      }

      if (res.success) {
        Swal.fire("Thành công", editingId ? "Đã cập nhật chiến dịch!" : "Đã tạo chiến dịch khuyến mại mới!", "success");
        setShowModal(false);
        fetchCampaigns();
      } else {
        Swal.fire("Lỗi", res.message || "Thao tác thất bại", "error");
      }
    } catch (err) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa chiến dịch quảng cáo này? Dữ liệu sẽ mất vĩnh viễn!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa chiến dịch",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.deleteCampaign(id);
        if (res.success) {
          Swal.fire("Đã xóa", "Chiến dịch đã được xóa bỏ khỏi hệ thống!", "success");
          fetchCampaigns();
        } else {
          Swal.fire("Thất bại", res.message || "Xóa thất bại", "error");
        }
      } catch (err) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-cyan-400" />
            Quản lý Chiến dịch Khuyến mại (Campaign Manager)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý và kích hoạt các chiến dịch ưu đãi Mùa cưới, Mùa kỷ yếu, Chiến dịch Tết, hay ưu đãi Sinh nhật...</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition"
        >
          <Plus className="h-4 w-4" />
          Tạo chiến dịch
        </button>
      </div>

      {/* Campaigns list table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 rounded-l-xl">Chiến dịch</th>
              <th className="py-3 px-3">Mô tả ngắn</th>
              <th className="py-3 px-3 text-center">Giảm giá (%)</th>
              <th className="py-3 px-3 text-center">Ngày bắt đầu</th>
              <th className="py-3 px-3 text-center">Ngày kết thúc</th>
              <th className="py-3 px-3 text-center">Trạng thái</th>
              <th className="py-3 px-3 text-center rounded-r-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto"></div>
                </td>
              </tr>
            ) : campaigns.length > 0 ? (
              campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800/10 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-white">{c.title}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-400 max-w-xs truncate">{c.description}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-cyan-400 flex items-center justify-center gap-0.5">
                    <Percent className="h-3 w-3 text-cyan-400" />
                    <span>{c.discountPercent}%</span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-400 text-xs">
                    {new Date(c.startDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-400 text-xs">
                    {new Date(c.endDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg border border-red-800/30 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-500">Chưa tạo chiến dịch khuyến mãi nào.</td>
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

      {/* Add/Edit Modal popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-cyan-400" />
                {editingId ? "Cập nhật Chiến dịch" : "Tạo Chiến dịch Mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 block">Tên chiến dịch:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Chiến dịch mùa kỷ yếu 2026..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block">Mô tả chiến dịch:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn..."
                  className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Tỷ lệ giảm giá (%):</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Trạng thái:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Ngày bắt đầu:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Ngày kết thúc:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
