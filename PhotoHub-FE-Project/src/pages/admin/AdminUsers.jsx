import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Search, UserCheck, UserX, Trash2, Eye } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [role, status, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        search,
        role,
        status,
        page,
        limit: 10
      });
      if (res.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.pages);
      } else {
        Swal.fire("Lỗi", res.message || "Không thể tải danh sách người dùng", "error");
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi kết nối", "Không thể kết nối đến máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Khóa / mở khóa tài khoản
  const handleToggleLock = async (userId, currentBlockedState) => {
    const actionText = currentBlockedState ? "mở khóa" : "khóa";
    const result = await Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc chắn muốn ${actionText} tài khoản này không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      background: "#1e293b",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        const res = await adminService.updateUserStatus(userId, !currentBlockedState);
        if (res.success) {
          Swal.fire("Thành công", `Đã ${actionText} tài khoản thành công!`, "success");
          fetchUsers();
          if (selectedUser && selectedUser.user?._id === userId) {
            setSelectedUser(null);
          }
        } else {
          Swal.fire("Thất bại", res.message || "Không thể thực hiện", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  // Xóa tài khoản (Soft Delete)
  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa tài khoản?",
      text: "Tài khoản sẽ bị đánh dấu xóa và khóa truy cập. Hành động này không thể hoàn tác trực tiếp!",
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
        const res = await adminService.deleteUser(userId);
        if (res.success) {
          Swal.fire("Đã xóa", "Đã soft-delete tài khoản thành công!", "success");
          fetchUsers();
          if (selectedUser && selectedUser.user?._id === userId) {
            setSelectedUser(null);
          }
        } else {
          Swal.fire("Thất bại", res.message || "Không thể thực hiện", "error");
        }
      } catch (e) {
        Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
      }
    }
  };

  // Xem chi tiết tài khoản
  const handleViewDetails = async (userId) => {
    try {
      const res = await adminService.getUserById(userId);
      if (res.success) {
        setSelectedUser(res.data);
      } else {
        Swal.fire("Lỗi", "Không thể lấy chi tiết tài khoản", "error");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Đã xảy ra lỗi kết nối", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Thành viên</h1>
        <p className="text-slate-400 text-sm mt-1">Tìm kiếm, lọc vai trò, quản lý khóa tài khoản và xóa mềm thành viên.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email, họ tên, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition">
            Tìm
          </button>
        </form>

        <div className="flex items-center gap-3">
          {/* Lọc Role */}
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="PHOTOGRAPHER">Nhiếp ảnh gia</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>

          {/* Lọc Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Đã xác thực)</option>
            <option value="PENDING">Chưa xác thực email</option>
            <option value="LOCKED">Đang bị khóa</option>
            <option value="DELETED">Đã xóa mềm</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Table of Users */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 rounded-l-xl">Họ tên / Email</th>
                <th className="py-3 px-3">Vai trò</th>
                <th className="py-3 px-3">Trạng thái</th>
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
              ) : users.length > 0 ? (
                users.map((u) => {
                  let statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Hoạt động</span>;
                  if (u.isDeleted) {
                    statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">Đã xóa mềm</span>;
                  } else if (u.isBlocked) {
                    statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400">Bị khóa</span>;
                  } else if (!u.isVerified) {
                    statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">Chưa verify</span>;
                  }

                  let roleBadge = <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 capitalize">{u.role}</span>;
                  if (u.role === "admin") {
                    roleBadge = <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/15 text-red-400 uppercase">Admin</span>;
                  } else if (u.role === "photographer") {
                    roleBadge = <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-400 capitalize">Nhiếp ảnh</span>;
                  }

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{u.fullName || "Chưa cập nhật"}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">{roleBadge}</td>
                      <td className="py-3 px-3">{statusBadge}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(u._id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {u.role !== "admin" && !u.isDeleted && (
                            <>
                              <button
                                onClick={() => handleToggleLock(u._id, u.isBlocked)}
                                className={`p-2 rounded-lg transition ${u.isBlocked
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                    : "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400"
                                  }`}
                                title={u.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {u.isBlocked ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-500">Không tìm thấy người dùng phù hợp.</td>
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

        {/* Side Panel: Detail View */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">Chi tiết thành viên</h2>
          {selectedUser ? (
            <div className="space-y-4">
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-orange-600 font-bold text-white flex items-center justify-center text-xl">
                  {selectedUser.user.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{selectedUser.user.fullName}</h3>
                  <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">{selectedUser.user.role}</p>
                  <p className="text-xs text-slate-500 mt-0.5">ID: {selectedUser.user._id}</p>
                </div>
              </div>

              {/* Data fields */}
              <div className="space-y-2.5 text-sm pt-4 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white font-medium">{selectedUser.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="text-white font-medium">{selectedUser.user.phoneNumber || "Chưa thiết lập"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Địa chỉ:</span>
                  <span className="text-white font-medium text-right max-w-[180px] truncate" title={selectedUser.user.address}>{selectedUser.user.address || "Chưa thiết lập"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Xác thực Email:</span>
                  <span className={selectedUser.user.isVerified ? "text-emerald-400 font-medium" : "text-yellow-400 font-medium"}>
                    {selectedUser.user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tham gia ngày:</span>
                  <span className="text-slate-300">{new Date(selectedUser.user.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>

              {/* Photographer Profile specific fields */}
              {selectedUser.profile && selectedUser.user.role === "photographer" && (
                <div className="space-y-2.5 text-sm pt-4 border-t border-slate-800/80">
                  <h4 className="font-bold text-orange-400 text-xs uppercase tracking-wider">Hồ sơ Photographer</h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nghệ danh:</span>
                    <span className="text-white font-medium">{selectedUser.profile.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Năm kinh nghiệm:</span>
                    <span className="text-white font-medium">{selectedUser.profile.experienceYears} năm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giá chụp / giờ:</span>
                    <span className="text-orange-400 font-bold">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedUser.profile.hourlyRate || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạng thái duyệt:</span>
                    <span className="text-yellow-500 font-semibold">{selectedUser.profile.verificationStatus}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-12">Chọn biểu tượng con mắt ở danh sách để xem chi tiết tài khoản.</p>
          )}
        </div>

      </div>

    </div>
  );
}
