const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const validatePurchaseSubscription = (req, res, next) => {
  const {
    packageId,
    photographerId,
    startDate,
    commitmentMonths,
    sessionsPerMonth,
    autoRenew,
    preferredSchedule,
    paymentMethodId,
  } = req.body || {};

  const errors = [];

  if (!packageId) errors.push("packageId is required");
  if (!photographerId) errors.push("photographerId is required");
  if (!startDate || Number.isNaN(new Date(startDate).getTime())) errors.push("startDate must be a valid date");
  if (commitmentMonths !== undefined && !isPositiveInteger(commitmentMonths)) errors.push("commitmentMonths must be a positive integer");
  if (sessionsPerMonth !== undefined && !isPositiveInteger(sessionsPerMonth)) errors.push("sessionsPerMonth must be a positive integer");
  if (autoRenew !== undefined && typeof autoRenew !== "boolean" && !["true", "false"].includes(String(autoRenew))) {
    errors.push("autoRenew must be boolean");
  }
  if (preferredSchedule !== undefined && !Array.isArray(preferredSchedule)) {
    errors.push("preferredSchedule must be an array");
  }
  if (paymentMethodId !== undefined && paymentMethodId !== null && typeof paymentMethodId !== "string") {
    errors.push("paymentMethodId must be a string");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
};

const validateIdParam = (paramName = "id") => (req, res, next) => {
  const value = req.params?.[paramName];
  if (!value) {
    return res.status(400).json({ success: false, message: `${paramName} is required` });
  }
  next();
};

const validatePauseSubscription = (req, res, next) => {
  const { pauseDays } = req.body || {};
  if (pauseDays !== undefined && (!Number.isInteger(Number(pauseDays)) || Number(pauseDays) <= 0)) {
    return res.status(400).json({ success: false, message: "pauseDays must be a positive integer" });
  }
  next();
};

const validateRenewSubscription = (req, res, next) => {
  const { forceCharge } = req.body || {};
  if (forceCharge !== undefined && typeof forceCharge !== "boolean" && !["true", "false"].includes(String(forceCharge))) {
    return res.status(400).json({ success: false, message: "forceCharge must be boolean" });
  }
  next();
};

const validatePreferredSchedule = (req, res, next) => {
  const { preferredSchedule } = req.body || {};
  if (preferredSchedule !== undefined && !Array.isArray(preferredSchedule)) {
    return res.status(400).json({ success: false, message: "preferredSchedule must be an array" });
  }
  next();
};

module.exports = {
  validatePurchaseSubscription,
  validateIdParam,
  validatePauseSubscription,
  validateRenewSubscription,
  validatePreferredSchedule,
};
