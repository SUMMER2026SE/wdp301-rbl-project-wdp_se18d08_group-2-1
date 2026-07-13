const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  RENEWING: "RENEWING",
  PENDING_CANCEL: "PENDING_CANCEL",
};

const BillingType = {
  MONTHLY: "MONTHLY",
  PER_SESSION: "PER_SESSION",
};

const BookingStatus = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  RESCHEDULED: "RESCHEDULED",
  NEED_RESCHEDULE: "NEED_RESCHEDULE",
};

const SubscriptionPaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

const SubscriptionPaymentKind = {
  PURCHASE: "PURCHASE",
  RENEWAL: "RENEWAL",
  PENALTY: "PENALTY",
};

module.exports = {
  SubscriptionStatus,
  BillingType,
  BookingStatus,
  SubscriptionPaymentStatus,
  SubscriptionPaymentKind,
};
