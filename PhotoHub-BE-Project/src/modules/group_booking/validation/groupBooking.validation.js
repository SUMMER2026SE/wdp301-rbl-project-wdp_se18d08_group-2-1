/**
 * groupBooking.validation.js
 *
 * Validation middleware cho Group Booking routes.
 * Sử dụng express-validator (đã có trong dependencies của dự án).
 */

const { body, param, query, validationResult } = require("express-validator");
const ApiResponse = require("../../../utils/ApiResponse");

/**
 * Middleware chạy sau mảng validators — tổng hợp lỗi và trả về 422.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join("; ");
    return ApiResponse.error(res, messages, 422);
  }
  next();
};

// ─── UC96: Tạo nhóm ──────────────────────────────────────────────────────────

/**
 * Validate body khi tạo Group Booking mới.
 */
const validateCreateGroup = [
  body("conceptId")
    .notEmpty()
    .withMessage("conceptId là bắt buộc")
    .isMongoId()
    .withMessage("conceptId không hợp lệ"),

  body("minMembers")
    .notEmpty()
    .withMessage("minMembers là bắt buộc")
    .isInt({ min: 2, max: 5 })
    .withMessage("Số thành viên tối thiểu phải từ 2 đến 5 người")
    .toInt(),

  body("maxMembers")
    .notEmpty()
    .withMessage("maxMembers là bắt buộc")
    .isInt({ min: 2, max: 5 })
    .withMessage("Số thành viên tối đa phải từ 2 đến 5 người")
    .toInt()
    .custom((value, { req }) => {
      if (value < req.body.minMembers) {
        throw new Error(
          "Số thành viên tối đa phải lớn hơn hoặc bằng số thành viên tối thiểu"
        );
      }
      return true;
    }),

  body("expireTime")
    .notEmpty()
    .withMessage("expireTime là bắt buộc")
    .isISO8601()
    .withMessage("expireTime phải là định dạng ISO 8601 hợp lệ")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Thời gian hết hạn phải là trong tương lai");
      }
      return true;
    }),

  body("shootDate")
    .notEmpty()
    .withMessage("shootDate là bắt buộc")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("shootDate phải là ngày có định dạng YYYY-MM-DD hợp lệ")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        throw new Error("Ngày chụp phải là ngày hôm nay hoặc trong tương lai");
      }
      return true;
    }),

  body("shootStartTime")
    .notEmpty()
    .withMessage("shootStartTime là bắt buộc")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("shootStartTime phải có định dạng HH:mm hợp lệ (ví dụ: 09:00)"),

  body("note")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Ghi chú không được quá 500 ký tự"),

  validate,
];

// ─── UC98: Tham gia nhóm ─────────────────────────────────────────────────────

/**
 * Validate params khi join nhóm qua groupId.
 */
const validateGroupIdParam = [
  param("groupId")
    .notEmpty()
    .withMessage("groupId là bắt buộc")
    .custom((value) => {
      const mongoose = require("mongoose");
      // Chấp nhận cả ObjectId lẫn groupCode (6-8 ký tự)
      if (
        !mongoose.Types.ObjectId.isValid(value) &&
        !/^[A-Z0-9]{6,8}$/i.test(value)
      ) {
        throw new Error("groupId phải là ObjectId hoặc groupCode hợp lệ");
      }
      return true;
    }),
  validate,
];

// ─── Query pagination ─────────────────────────────────────────────────────────

/**
 * Validate query params cho danh sách (discover, my groups).
 */
const validateListQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên dương")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit phải từ 1 đến 50")
    .toInt(),

  query("conceptId")
    .optional()
    .isMongoId()
    .withMessage("conceptId không hợp lệ"),

  query("status")
    .optional()
    .isIn(["PENDING", "CONFIRMED", "CANCELED"])
    .withMessage("status phải là PENDING, CONFIRMED hoặc CANCELED"),

  validate,
];

module.exports = {
  validateCreateGroup,
  validateGroupIdParam,
  validateListQuery,
};
