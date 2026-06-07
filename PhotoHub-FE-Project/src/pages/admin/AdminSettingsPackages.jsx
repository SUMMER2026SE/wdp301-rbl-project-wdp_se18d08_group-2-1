import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Settings, Percent, Bell, Tag, Check, Trash2, Plus, Edit } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminSettingsPackages() {
  // Commission settings state
  const [commissionRateInput, setCommissionRateInput] = useState(10); // in percent e.g. 10 for 10%
  const [currentCommissionRate, setCurrentCommissionRate] = useState(0.10);

  // Send Notification state
  const [recipientType, setRecipientType] = useState("ALL");
  const [recipientId, setRecipientId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // Packages state
  const [packages, setPackages] = useState([]);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgDuration, setPkgDuration] = useState(30);
  const [pkgStatus, setPkgStatus] = useState("ACTIVE");

  useEffect(() => {
    fetchCommissionRate();
    fetchPackages();
  }, []);

  const fetchCommissionRate = async () => {
    try {
      const res = await adminService.getCommissionSummary();
      if (res.success) {
        setCurrentCommissionRate(res.data.currentCommissionRate);
        setCommissionRateInput(res.data.currentCommissionRate * 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await adminService.getFeaturedPackages();
      if (res.success) {
        setPackages(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    const rateVal = parseFloat(commissionRateInput) / 100;
    if (isNaN(rateVal) || rateVal < 0.05 || rateVal > 0.30) {
      Swal.fire("Lỗi", "Tỷ lệ hoa hồng phải dao động từ 5% đến 30%!", "error");
      return;
    }

    try {
      const res = await adminService.updateCommissionRate(rateVal);
      if (res.success) {
        Swal.fire("Thành công", "Đã cập nhật tỷ lệ chiết khấu hoa hồng của nền tảng!", "success");
        fetchCommissionRate();
      } else {
        Swal.fire("Thất bại", res.message || "Không thể cập nhật", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      Swal.fire("Lỗi", "Vui lòng điền đầy đủ tiêu đề và nội dung thông báo!", "error");
      return;
    }

    try {
      const res = await adminService.sendSystemNotification({
        recipientType,
        recipientId: recipientType === "SPECIFIC" ? recipientId : undefined,
        title: notifTitle,
        message: notifMessage
      });

      if (res.success) {
        Swal.fire("Thành công", "Đã gửi thông báo hệ thống thành công!", "success");
        setNotifTitle("");
        setNotifMessage("");
        setRecipientId("");
      } else {
        Swal.fire("Thất bại", res.message || "Gửi thông báo thất bại", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!pkgTitle || pkgPrice < 0 || pkgDuration <= 0) {
      Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin gói quảng bá hợp lệ!", "error");
      return;
    }

    try {
      let res;
      if (editingPackageId) {
        res = await adminService.updateFeaturedPackage(editingPackageId, {
          title: pkgTitle,
          description: pkgDesc,
          price: pkgPrice,
          durationDays: pkgDuration,
          status: pkgStatus
        });
      } else {
        res = await adminService.createFeaturedPackage({
          title: pkgTitle,
          description: pkgDesc,
          price: pkgPrice,
          durationDays: pkgDuration,
          status: pkgStatus
        });
      }

      if (res.success) {
        Swal.fire("Thành công", editingPackageId ? "Đã cập nhật gói nổi bật!" : "Đã thêm gói nổi bật mới!", "success");
        resetPackageForm();
        fetchPackages();
      } else {
        Swal.fire("Lỗi", res.message || "Không thể lưu gói", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error");
    }
  };

  const handleEditPackageClick = (pkg) => {
    setEditingPackageId(pkg._id);
    setPkgTitle(pkg.title);
    setPkgDesc(pkg.description || "");
    setPkgPrice(pkg.price);
    setPkgDuration(pkg.durationDays);
    setPkgStatus(pkg.status);
  };

  const handleDeletePackage = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa gói?",
      text: "Xóa gói này khỏi danh sách dịch vụ quảng bá của nền tảng.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.deleteFeaturedPackage(id);
        if (res.success) {
          Swal.fire("Thành công", "Đã xóa gói nổi bật!", "success");
          fetchPackages();
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  const resetPackageForm = () => {
    setEditingPackageId(null);
    setPkgTitle("");
    setPkgDesc("");
    setPkgPrice(0);
    setPkgDuration(30);
    setPkgStatus("ACTIVE");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình Hệ thống & Gói dịch vụ</h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý các gói quảng bá (Featured), cài đặt mức hoa hồng chiết khấu, và phát thông báo hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Commission rate & Send Notifications */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Commission configurations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="h-4.5 w-4.5 text-cyan-400" />
              Tỷ lệ hoa hồng
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Mức khấu trừ khi hoàn tất lịch chụp. Hiện tại: <span className="font-bold text-white">{(currentCommissionRate * 100).toFixed(0)}%</span>.
            </p>
            <form onSubmit={handleUpdateCommission} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="flex items-center text-slate-400 text-sm font-bold bg-slate-800 border border-slate-700 px-3.5 rounded-xl">%</span>
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 font-bold transition text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Cập nhật Tỷ lệ
              </button>
            </form>
          </div>

          {/* System announcements */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-cyan-400" />
              Gửi thông báo hệ thống
            </h2>
            <form onSubmit={handleSendNotification} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Đối tượng nhận:</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="ALL">Tất cả người dùng</option>
                  <option value="CUSTOMER">Chỉ Khách hàng (Customers)</option>
                  <option value="PHOTOGRAPHER">Chỉ Nhiếp ảnh gia (Photographers)</option>
                  <option value="SPECIFIC">Gửi riêng một thành viên</option>
                </select>
              </div>

              {recipientType === "SPECIFIC" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">ID tài khoản người nhận:</label>
                  <input
                    type="text"
                    placeholder="Nhập MongoDB User ID..."
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Tiêu đề thông báo:</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Nội dung chi tiết:</label>
                <textarea
                  placeholder="Nhập nội dung thông báo gửi đến app..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 font-bold transition text-xs flex items-center justify-center gap-1.5"
              >
                Gửi thông báo
              </button>
            </form>
          </div>

        </div>

        {/* Right column: Packages CRUD */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Packages lists */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-cyan-400" />
              Gói dịch vụ quảng bá
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <div key={pkg._id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {pkg.title}
                        {pkg.status === "ACTIVE" 
                          ? <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                          : <span className="bg-slate-800 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold">INACTIVE</span>
                        }
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{pkg.description || "Không có mô tả"}</p>
                      <p className="text-xs text-cyan-400 font-bold mt-2">
                        {formatCurrency(pkg.price)} <span className="text-slate-400 font-normal">/ {pkg.durationDays} ngày</span>
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditPackageClick(pkg)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg._id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                        title="Xóa gói"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-12">Không có gói quảng bá nào trên hệ thống.</p>
              )}
            </div>
          </div>

          {/* Create / Edit package form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-cyan-400" />
              {editingPackageId ? "Chỉnh sửa Gói" : "Thêm Gói mới"}
            </h2>

            <form onSubmit={handleSavePackage} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Tên gói dịch vụ:</label>
                <input
                  type="text"
                  placeholder="Gói nhiếp ảnh gia tiêu biểu,..."
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Mô tả lợi ích:</label>
                <input
                  type="text"
                  placeholder="Nhập mô tả..."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Giá bán (VND):</label>
                  <input
                    type="number"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Thời gian (Ngày):</label>
                  <input
                    type="number"
                    value={pkgDuration}
                    onChange={(e) => setPkgDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Trạng thái gói:</label>
                <select
                  value={pkgStatus}
                  onChange={(e) => setPkgStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
                  <option value="INACTIVE">Không kích hoạt (INACTIVE)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 font-bold transition text-xs flex items-center justify-center gap-1"
                >
                  {editingPackageId ? "Cập nhật" : "Tạo gói"}
                </button>
                <button
                  type="button"
                  onClick={resetPackageForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 font-bold transition text-xs"
                >
                  Hủy / Reset
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
