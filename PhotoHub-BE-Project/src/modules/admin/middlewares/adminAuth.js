const ApiResponse = require("../../../utils/ApiResponse");

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, "Unauthorized - Please log in", 401);
  }
  
  // Kiểm tra vai trò, khớp với UserRole.ADMIN = "admin"
  if (req.user.role !== "admin") {
    return ApiResponse.error(res, "Forbidden - Quyền Admin được yêu cầu", 403);
  }
  
  next();
};

module.exports = verifyAdmin;
