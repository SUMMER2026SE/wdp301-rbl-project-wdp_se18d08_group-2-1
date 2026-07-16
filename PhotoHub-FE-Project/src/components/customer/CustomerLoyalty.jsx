import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Award, 
  History, 
  UserPlus, 
  Copy, 
  Check, 
  Coins,
  Ticket,
  Clock,
  Image as ImageIcon
} from "lucide-react";
import Swal from "sweetalert2";
import { loyaltyService } from "../../services/loyaltyService";

export default function CustomerLoyalty({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState({ vouchers: [], addons: [] });
  const [voucherCatalog, setVoucherCatalog] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const [accRes, histRes, rewRes, catalogRes] = await Promise.all([
        loyaltyService.getLoyaltyAccount(),
        loyaltyService.getLoyaltyHistory(),
        loyaltyService.getLoyaltyRewards(),
        loyaltyService.getRewardCatalog()
      ]);

      if (accRes.success) setAccount(accRes.data);
      if (histRes.success) setHistory(histRes.data);
      if (rewRes.success) setRewards(rewRes.data);
      if (catalogRes.success) setVoucherCatalog(catalogRes.data.vouchers || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu tích điểm:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (!account?.referralCode) return;
    const inviteLink = `${window.location.origin}/login?referralCode=${account.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async (rewardType, rewardName, pointsCost) => {
    if (!account || account.points < pointsCost) {
      Swal.fire({
        icon: "error",
        title: language === "vi" ? "Thiếu điểm" : "Insufficient Points",
        text: language === "vi" ? "Bạn không đủ điểm tích lũy để đổi quà này." : "You do not have enough points to redeem this reward.",
        background: isDark ? "#0f172a" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: language === "vi" ? "Xác nhận đổi quà?" : "Confirm Redemption?",
      text: language === "vi" 
        ? `Bạn có chắc muốn đổi ${pointsCost} điểm lấy "${rewardName}" không?` 
        : `Are you sure you want to spend ${pointsCost} points for "${rewardName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: language === "vi" ? "Đồng ý" : "Yes",
      cancelButtonText: language === "vi" ? "Hủy" : "Cancel",
      confirmButtonColor: "#f97316",
      background: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await loyaltyService.redeemReward(rewardType);
        if (res.success) {
          Swal.fire({
            icon: "success",
            title: language === "vi" ? "Đổi quà thành công!" : "Redeemed Successfully!",
            text: language === "vi" 
              ? `Bạn đã đổi thành công "${rewardName}". Hãy kiểm tra trong "Kho quà của tôi".` 
              : `You have successfully redeemed "${rewardName}". Check "My Rewards".`,
            background: isDark ? "#0f172a" : "#fff",
            color: isDark ? "#fff" : "#000",
          });
          fetchLoyaltyData();
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: res.message,
            background: isDark ? "#0f172a" : "#fff",
            color: isDark ? "#fff" : "#000",
          });
        }
      } catch (error) {
        console.error("Đổi quà lỗi:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span>{language === "vi" ? "Đang tải dữ liệu điểm thưởng..." : "Loading rewards..."}</span>
      </div>
    );
  }

  // Next tier calculation helper
  const getNextTierInfo = () => {
    if (!account) return { next: "", needed: 0, percent: 100 };
    const total = account.totalPointsAccumulatedYear || 0;
    if (total < 1000) {
      return { next: "Gold", needed: 1000 - total, percent: (total / 1000) * 100 };
    } else if (total < 5000) {
      return { next: "Platinum", needed: 5000 - total, percent: ((total - 1000) / 4000) * 100 };
    }
    return { next: "MAX", needed: 0, percent: 100 };
  };

  const nextTier = getNextTierInfo();

  const catalog = [
    ...voucherCatalog.map((voucher) => ({
      id: `VOUCHER_TEMPLATE_${voucher._id}`,
      name: language === "vi"
        ? `Voucher giảm ${Number(voucher.discountAmount).toLocaleString("vi-VN")} VND`
        : `${Number(voucher.discountAmount).toLocaleString()} VND voucher`,
      desc: language === "vi"
        ? `Đổi từ chương trình ${voucher.code}, dùng cho đơn đặt chụp sau khi đổi.`
        : `Redeem from ${voucher.code} before using it for a booking.`,
      cost: voucher.pointsCost,
      icon: Ticket,
      color: "from-amber-500 to-orange-600",
    })),
    {
      id: "EXTRA_TIME",
      name: language === "vi" ? "Tặng 30 phút chụp hình" : "Extra 30 Mins Shoot",
      desc: language === "vi" ? "Cộng thêm 30 phút chụp miễn phí cho dự án của bạn." : "Add 30 minutes to your shooting session for free.",
      cost: 300,
      icon: Clock,
      color: "from-teal-500 to-emerald-600"
    },
    {
      id: "EXTRA_RETOUCH",
      name: language === "vi" ? "Tặng 5 ảnh retouch" : "Extra 5 Retouched Photos",
      desc: language === "vi" ? "Nhiếp ảnh gia chỉnh sửa thêm 5 tấm hình nghệ thuật." : "Photographer will retouch 5 additional photos for free.",
      cost: 200,
      icon: ImageIcon,
      color: "from-blue-500 to-indigo-600"
    }
  ];

  const labelClass = `text-sm font-semibold transition-colors ${isDark ? "text-slate-400" : "text-slate-700"}`;
  const cardClass = `border rounded-3xl p-6 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200/80 shadow-sm"}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. MEMBERSHIP BANNER */}
      <div className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br text-white shadow-xl ${
        account?.membershipTier === "Platinum" 
          ? "from-slate-800 via-indigo-950 to-slate-900" 
          : account?.membershipTier === "Gold"
          ? "from-amber-600 via-orange-600 to-amber-700"
          : "from-slate-600 via-slate-700 to-slate-800"
      }`}>
        {/* Glow circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-orange-500/10 blur-xl"></div>

        <div className="relative grid md:grid-cols-3 gap-6 items-center">
          {/* Tier Badge */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <span className="text-xs uppercase tracking-wider text-white/70">
              {language === "vi" ? "Hạng thành viên" : "Membership Tier"}
            </span>
            <div className="flex items-center gap-3">
              <Award className="h-10 w-10 text-yellow-300 animate-pulse" />
              <h1 className="text-3xl font-extrabold tracking-wide uppercase text-yellow-100">
                {account?.membershipTier || "Silver"}
              </h1>
            </div>
            <p className="text-xs text-white/80">
              {account?.membershipTier === "Platinum" 
                ? (language === "vi" ? "Hệ số điểm: 1.5x | Giảm giá: 10% phí hệ thống" : "Multiplier: 1.5x | Discount: 10% system fee")
                : account?.membershipTier === "Gold"
                ? (language === "vi" ? "Hệ số điểm: 1.2x | Giảm giá: 5% phí hệ thống" : "Multiplier: 1.2x | Discount: 5% system fee")
                : (language === "vi" ? "Hệ số điểm: 1.0x | Silver member" : "Multiplier: 1.0x | Silver member")
              }
            </p>
          </div>

          {/* Points Balance */}
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-white/70">
              {language === "vi" ? "Điểm khả dụng" : "Redeemable Points"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="h-8 w-8 text-yellow-300" />
              <span className="text-4xl font-black text-white">
                {account?.points?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-xs text-white/60 mt-1">
              {language === "vi" ? `Tổng tích lũy năm: ${account?.totalPointsAccumulatedYear || 0}đ` : `Total this year: ${account?.totalPointsAccumulatedYear || 0} pts`}
            </span>
          </div>

          {/* Next Tier Progress */}
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>{language === "vi" ? "Tiến trình hạng" : "Tier Progress"}</span>
              <span>
                {nextTier.next === "MAX" 
                  ? (language === "vi" ? "Tối đa" : "Max Tier") 
                  : (language === "vi" ? `Cần +${nextTier.needed} lên ${nextTier.next}` : `Need +${nextTier.needed} for ${nextTier.next}`)
                }
              </span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-yellow-300 h-full rounded-full transition-all duration-500" 
                style={{ width: `${nextTier.percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBTABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeSubTab === "overview"
              ? "border-orange-500 text-orange-500"
              : isDark
              ? "border-transparent text-slate-400 hover:text-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "vi" ? "Tổng quan & Giới thiệu" : "Overview & Referrals"}
        </button>
        <button
          onClick={() => setActiveSubTab("redeem")}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeSubTab === "redeem"
              ? "border-orange-500 text-orange-500"
              : isDark
              ? "border-transparent text-slate-400 hover:text-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "vi" ? "Đổi điểm nhận quà" : "Redeem Catalog"}
        </button>
        <button
          onClick={() => setActiveSubTab("myrewards")}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeSubTab === "myrewards"
              ? "border-orange-500 text-orange-500"
              : isDark
              ? "border-transparent text-slate-400 hover:text-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "vi" ? "Kho quà của tôi" : "My Rewards"}
        </button>
        <button
          onClick={() => setActiveSubTab("history")}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeSubTab === "history"
              ? "border-orange-500 text-orange-500"
              : isDark
              ? "border-transparent text-slate-400 hover:text-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "vi" ? "Lịch sử tích điểm" : "Point History"}
        </button>
      </div>

      {/* 3. SUBTAB CONTENT AREA */}
      <div className="mt-4">
        {activeSubTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Referral program */}
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-4 text-orange-500">
                <UserPlus size={24} />
                <h3 className="text-xl font-bold">{language === "vi" ? "Chương trình Giới thiệu" : "Referral Program"}</h3>
              </div>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {language === "vi"
                  ? "Chia sẻ mã giới thiệu hoặc link của bạn cho bạn bè đăng ký. Khi họ hoàn thành buổi đặt lịch chụp hình đầu tiên, cả bạn và bạn bè đều được cộng ngay 200 điểm thưởng!"
                  : "Invite friends using your link. When they sign up and complete their first photography booking, both of you will receive 200 reward points instantly!"
                }
              </p>
              
              <div className="space-y-2">
                <label className={labelClass}>{language === "vi" ? "Link giới thiệu của bạn" : "Your Referral Link"}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/login?referralCode=${account?.referralCode || ""}`}
                    className={`flex-1 rounded-xl px-4 py-3 outline-none border text-sm ${
                      isDark ? "bg-[#0f172a] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <button
                    onClick={handleCopyReferral}
                    className="bg-orange-500 hover:bg-orange-400 text-white rounded-xl px-4 flex items-center justify-center transition shadow-md shadow-orange-500/20"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-500 mt-1">
                    {language === "vi" ? "Đã sao chép link giới thiệu!" : "Referral link copied!"}
                  </p>
                )}
              </div>
            </div>

            {/* Benefits summary card */}
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-4 text-orange-500">
                <Award size={24} />
                <h3 className="text-xl font-bold">{language === "vi" ? "Quyền lợi thành viên" : "Membership Benefits"}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/10 text-sm">
                  <span className="font-semibold text-slate-400">Silver</span>
                  <span>{language === "vi" ? "Tích lũy 1.0x | 0% chiết khấu" : "Earn 1.0x | 0% discount"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/10 text-sm">
                  <span className="font-semibold text-amber-500">Gold</span>
                  <span>{language === "vi" ? "Tích lũy 1.2x | Giảm 5% phí hệ thống" : "Earn 1.2x | 5% fee discount"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 text-sm">
                  <span className="font-semibold text-indigo-400">Platinum</span>
                  <span>{language === "vi" ? "Tích lũy 1.5x | Giảm 10% phí hệ thống" : "Earn 1.5x | 10% fee discount"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "redeem" && (
          <div className="grid md:grid-cols-2 gap-6">
            {catalog.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={`${cardClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`p-3 rounded-2xl bg-gradient-to-r ${item.color} text-white`}>
                        <Icon size={22} />
                      </span>
                      <h4 className="font-bold text-lg">{item.name}</h4>
                    </div>
                    <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <span className="text-orange-500 font-bold flex items-center gap-1.5">
                      <Coins size={16} />
                      {item.cost} {language === "vi" ? "điểm" : "points"}
                    </span>
                    <button
                      onClick={() => handleRedeem(item.id, item.name, item.cost)}
                      className="bg-orange-500 hover:bg-orange-400 text-white rounded-xl px-5 py-2 text-xs font-semibold transition shadow-md shadow-orange-500/20"
                    >
                      {language === "vi" ? "Đổi điểm" : "Redeem"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSubTab === "myrewards" && (
          <div className="space-y-6">
            {/* Vouchers */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Ticket size={20} className="text-orange-500" />
                {language === "vi" ? "Mã giảm giá đã đổi" : "Redeemed Vouchers"}
              </h3>
              {rewards.vouchers.length === 0 ? (
                <p className="text-sm text-slate-500">{language === "vi" ? "Bạn chưa đổi mã giảm giá nào." : "No vouchers redeemed yet."}</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {rewards.vouchers.map((v) => (
                    <div key={v._id} className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b0f19] border-white/5" : "bg-white border-slate-200"} flex flex-col justify-between`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-orange-500 font-bold text-lg">-{v.discountAmount.toLocaleString()} VND</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            v.isUsed ? "bg-slate-500/20 text-slate-400" : "bg-green-500/20 text-green-400"
                          }`}>
                            {v.isUsed ? (language === "vi" ? "Đã dùng" : "Used") : (language === "vi" ? "Chưa dùng" : "Active")}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2 items-center">
                          <span className="text-xs text-slate-500">Mã coupon:</span>
                          <span className="text-sm font-mono bg-orange-500/10 px-2 py-0.5 rounded text-orange-400 font-bold">{v.code}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-4">
                        {language === "vi" 
                          ? `Hết hạn: ${new Date(v.expiryDate).toLocaleDateString("vi-VN")}` 
                          : `Expires: ${new Date(v.expiryDate).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addon Rewards */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-500" />
                {language === "vi" ? "Tiện ích tặng kèm" : "Redeemed Addons"}
              </h3>
              {rewards.addons.length === 0 ? (
                <p className="text-sm text-slate-500">{language === "vi" ? "Bạn chưa đổi tiện ích nào." : "No addons redeemed yet."}</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {rewards.addons.map((a) => (
                    <div key={a._id} className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b0f19] border-white/5" : "bg-white border-slate-200"} flex flex-col justify-between`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-white-100">{a.description}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            a.isUsed ? "bg-slate-500/20 text-slate-400" : "bg-green-500/20 text-green-400"
                          }`}>
                            {a.isUsed ? (language === "vi" ? "Đã dùng" : "Used") : (language === "vi" ? "Chưa dùng" : "Active")}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-4">
                        {language === "vi" ? "Sử dụng bằng cách chọn lúc đặt lịch chụp" : "Select this reward addon during new booking creation"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "history" && (
          <div className={cardClass}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History size={20} className="text-orange-500" />
              {language === "vi" ? "Nhật ký điểm thưởng" : "Rewards Point Audit Log"}
            </h3>
            
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">{language === "vi" ? "Không có lịch sử biến động điểm." : "No point histories logged."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400">
                      <th className="py-3 px-4">{language === "vi" ? "Ngày" : "Date"}</th>
                      <th className="py-3 px-4">{language === "vi" ? "Chi tiết" : "Details"}</th>
                      <th className="py-3 px-4">{language === "vi" ? "Loại giao dịch" : "Type"}</th>
                      <th className="py-3 px-4 text-right">{language === "vi" ? "Biến động" : "Change"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id} className="border-b border-slate-200 dark:border-white/5 hover:bg-white/5">
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(h.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </td>
                        <td className="py-3.5 px-4 font-medium">{h.description}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            h.type.startsWith("Earn_") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${
                          h.points > 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {h.points > 0 ? `+${h.points}` : h.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
