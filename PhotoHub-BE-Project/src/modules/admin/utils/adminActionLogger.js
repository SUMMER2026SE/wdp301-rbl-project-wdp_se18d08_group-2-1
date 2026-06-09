const AdminAction = require("../models/AdminAction");

const logAdminAction = async (adminId, actionType, targetType, targetId, details = {}, req = null) => {
  try {
    let ipAddress = "";
    if (req) {
      ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    }
    await AdminAction.create({
      admin: adminId,
      actionType,
      targetType,
      targetId: String(targetId),
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("❌ Lỗi khi ghi log AdminAction:", error);
  }
};

module.exports = logAdminAction;
