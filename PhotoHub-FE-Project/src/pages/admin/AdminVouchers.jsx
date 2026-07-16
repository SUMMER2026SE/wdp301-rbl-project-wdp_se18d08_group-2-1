import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { loyaltyService } from "../../services/loyaltyService";

const emptyForm = {
  code: "", discountAmount: "", pointsCost: "0", userId: "", expiryDate: "", isUsed: false,
  scope: "GLOBAL", isActive: true, usageLimit: "",
};

export default function AdminVouchers({ accounts = [] }) {
  const [vouchers, setVouchers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadVouchers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await loyaltyService.adminGetVouchers(page, 10, status);
      if (!res.success) throw new Error(res.message || "Không thể tải voucher");
      setVouchers(res.data.vouchers || []);
      setPages(res.data.pagination?.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVouchers(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEdit = (voucher) => {
    setEditingId(voucher._id);
    setForm({
      code: voucher.code,
      discountAmount: voucher.discountAmount,
      pointsCost: voucher.pointsCost,
      userId: voucher.userId?._id || voucher.userId,
      expiryDate: new Date(voucher.expiryDate).toISOString().slice(0, 10),
      isUsed: voucher.isUsed,
      scope: voucher.scope || "PERSONAL",
      isActive: voucher.isActive !== false,
      usageLimit: voucher.usageLimit || "",
    });
    setError("");
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      discountAmount: Number(form.discountAmount),
      pointsCost: Number(form.pointsCost),
      userId: form.scope === "PERSONAL" ? form.userId : null,
      usageLimit: form.scope === "GLOBAL" && form.usageLimit ? Number(form.usageLimit) : null,
      expiryDate: new Date(`${form.expiryDate}T23:59:59`).toISOString(),
    };
    const res = editingId
      ? await loyaltyService.adminUpdateVoucher(editingId, payload)
      : await loyaltyService.adminCreateVoucher(payload);
    if (!res.success) return setError(res.message || "Không thể lưu voucher");
    setShowForm(false);
    await loadVouchers();
  };

  const remove = async (voucher) => {
    if (!window.confirm(`Xóa voucher ${voucher.code}?`)) return;
    const res = await loyaltyService.adminDeleteVoucher(voucher._id);
    if (!res.success) return setError(res.message || "Không thể xóa voucher");
    await loadVouchers();
  };

  return (
    <div>
      <div className="p-5 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Còn hiệu lực</option>
          <option value="used">Đã sử dụng</option>
          <option value="expired">Đã hết hạn</option>
        </select>
        <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold">
          <Plus size={17} /> Tạo voucher
        </button>
      </div>

      {error && <div className="m-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
            <tr><th className="p-4">Mã</th><th className="p-4">Phạm vi</th><th className="p-4 text-right">Giảm giá</th><th className="p-4 text-right">Lượt dùng</th><th className="p-4">Hết hạn</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="p-12 text-center text-slate-400">Đang tải voucher...</td></tr> :
              vouchers.length === 0 ? <tr><td colSpan="7" className="p-12 text-center text-slate-500">Chưa có voucher.</td></tr> :
              vouchers.map((v) => {
                const expired = new Date(v.expiryDate) <= new Date();
                return <tr key={v._id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                  <td className="p-4 font-mono font-bold text-orange-400">{v.code}</td>
                  <td className="p-4">{v.scope === "GLOBAL" ? <span className="text-blue-400 font-semibold">Cửa hàng đổi điểm</span> : <><div className="text-white">{v.userId?.fullName || "Không rõ"}</div><div className="text-xs text-slate-500">{v.userId?.email}</div></>}</td>
                  <td className="p-4 text-right">{Number(v.discountAmount).toLocaleString("vi-VN")}đ</td>
                  <td className="p-4 text-right">{v.scope === "GLOBAL" ? `${v.usedCount || 0} / ${v.usageLimit || "∞"}` : (v.isUsed ? "1 / 1" : "0 / 1")}</td>
                  <td className="p-4 text-slate-400">{new Date(v.expiryDate).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${v.isActive === false || v.isUsed ? "bg-slate-700 text-slate-300" : expired ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>{v.isActive === false ? "Đã tắt" : v.isUsed ? "Đã dùng" : expired ? "Hết hạn" : "Khả dụng"}</span></td>
                  <td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(v)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" title="Sửa"><Pencil size={16} /></button><button onClick={() => remove(v)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Xóa"><Trash2 size={16} /></button></div></td>
                </tr>;
              })}
          </tbody>
        </table>
      </div>
      {pages > 1 && <div className="p-4 border-t border-slate-800 flex justify-between text-sm text-slate-400"><span>Trang {page} / {pages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 bg-slate-800 disabled:opacity-30 rounded-lg"><ChevronLeft size={16} /></button><button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-2 bg-slate-800 disabled:opacity-30 rounded-lg"><ChevronRight size={16} /></button></div></div>}

      {showForm && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <form onSubmit={submit} className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between"><h2 className="text-xl font-bold">{editingId ? "Cập nhật voucher" : "Tạo voucher"}</h2><button type="button" onClick={() => setShowForm(false)}><X /></button></div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <label className="block text-sm text-slate-300">Mã voucher<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" /></label>
          <label className="block text-sm text-slate-300">Loại voucher<select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value, userId: "" })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5"><option value="GLOBAL">Đưa vào cửa hàng đổi điểm</option><option value="PERSONAL">Tặng trực tiếp cho người dùng</option></select></label>
          {form.scope === "PERSONAL" && <label className="block text-sm text-slate-300">Người nhận<select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5"><option value="">Chọn hội viên</option>{accounts.map((a) => <option key={a.userId?._id} value={a.userId?._id}>{a.userId?.fullName} — {a.userId?.email}</option>)}</select></label>}
          <div className="grid grid-cols-2 gap-4"><label className="text-sm text-slate-300">Số tiền giảm<input required min="1" type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" /></label><label className="text-sm text-slate-300">Điểm cần đổi<input required min={form.scope === "GLOBAL" ? "1" : "0"} type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" /></label></div>
          <label className="block text-sm text-slate-300">Ngày hết hạn<input required type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" /></label>
          {form.scope === "GLOBAL" && <label className="block text-sm text-slate-300">Số lượt được đổi (để trống nếu không giới hạn)<input min="1" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5" /></label>}
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-800">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold">Lưu voucher</button></div>
        </form>
      </div>}
    </div>
  );
}
