const { PayOS } = require("@payos/node");
const SubscriptionPayment = require("./models/subscriptionPayment.model");
const { SubscriptionPaymentStatus, SubscriptionPaymentKind } = require("./subscription.constants");

const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
const RETURN_URL = process.env.PAYOS_RETURN_URL || process.env.FE_PAYMENT_RESULT_URL || `${DEFAULT_FRONTEND_URL}/payment/result`;
const CANCEL_URL = process.env.PAYOS_CANCEL_URL || `${DEFAULT_FRONTEND_URL}/payment/result?canceled=true`;

const hasPayOSConfig = () =>
  Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);

const payos = hasPayOSConfig()
  ? new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    })
  : null;

const createOrderCode = () => Number(String(Date.now()).slice(-9)) + Math.floor(Math.random() * 1000);

const appendQuery = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const getPaymentLinkInfo = async (orderCodeOrPaymentLinkId) => {
  if (!payos) {
    throw new Error("PayOS is not configured");
  }

  if (payos.paymentRequests?.get) {
    return await payos.paymentRequests.get(orderCodeOrPaymentLinkId);
  }

  return await payos.getPaymentLinkInformation(orderCodeOrPaymentLinkId);
};

const buildCheckoutPayload = (payment) => ({
  orderCode: payment.orderCode,
  amount: payment.amount,
  description: String(payment.metadata?.packageName || payment.metadata?.packageTitle || payment.metadata?.subscriptionName || payment.paymentKind || "subscription").slice(0, 25),
  items: [
    {
      name: String(payment.metadata?.packageName || payment.metadata?.packageTitle || payment.metadata?.subscriptionName || payment.paymentKind || "Subscription").slice(0, 25),
      quantity: 1,
      price: payment.amount,
    },
  ],
  returnUrl: RETURN_URL,
  cancelUrl: CANCEL_URL,
});

class SubscriptionPaymentService {
  async createPaymentRecord({
    subscription,
    customer,
    photographer,
    paymentMethod = null,
    amount,
    billingType,
    paymentKind,
    provider = "PAYOS",
    metadata = {},
  }) {
    const orderCode = createOrderCode();
    const record = await SubscriptionPayment.create({
      subscription: subscription._id,
      customer,
      photographer,
      paymentMethod: paymentMethod?._id || paymentMethod || null,
      amount,
      billingType,
      paymentKind,
      provider,
      orderCode,
      status: SubscriptionPaymentStatus.PENDING,
      metadata,
      payloadSnapshot: metadata,
    });
    return record;
  }

  async createPayOSLink(paymentRecord) {
    if (!payos || process.env.SUBSCRIPTION_ALLOW_MOCK_PAYMENT === "true") {
      const packageName = String(paymentRecord.metadata?.packageName || paymentRecord.metadata?.packageTitle || paymentRecord.paymentKind || "Subscription");
      const mockUrl = appendQuery(RETURN_URL, {
        mock: "true",
        source: "subscription",
        orderCode: paymentRecord.orderCode,
        paymentKind: paymentRecord.paymentKind,
        packageName,
      });
      paymentRecord.paymentLink = mockUrl;
      paymentRecord.provider = "MOCK";
      await paymentRecord.save();
      return {
        provider: "MOCK",
        checkoutUrl: mockUrl,
        orderCode: paymentRecord.orderCode,
        paymentLink: mockUrl,
      };
    }

    const payload = buildCheckoutPayload(paymentRecord);
    payload.returnUrl = appendQuery(RETURN_URL, {
      source: "subscription",
      orderCode: paymentRecord.orderCode,
      paymentKind: paymentRecord.paymentKind,
      packageName: paymentRecord.metadata?.packageName || paymentRecord.metadata?.packageTitle || paymentRecord.metadata?.subscriptionName || "",
    });
    payload.cancelUrl = appendQuery(CANCEL_URL, {
      source: "subscription",
      orderCode: paymentRecord.orderCode,
      paymentKind: paymentRecord.paymentKind,
      packageName: paymentRecord.metadata?.packageName || paymentRecord.metadata?.packageTitle || paymentRecord.metadata?.subscriptionName || "",
    });
    const result = payos.paymentRequests?.create
      ? await payos.paymentRequests.create(payload)
      : await payos.createPaymentLink(payload);

    paymentRecord.paymentLinkId = result?.paymentLinkId || result?.payment_link_id || null;
    paymentRecord.paymentLink = result?.checkoutUrl || result?.checkout_url || result?.paymentLink || null;
    paymentRecord.metadata = {
      ...(paymentRecord.metadata || {}),
      payosResult: result,
    };
    await paymentRecord.save();

    return {
      provider: "PAYOS",
      checkoutUrl: paymentRecord.paymentLink,
      orderCode: paymentRecord.orderCode,
      paymentLinkId: paymentRecord.paymentLinkId,
      raw: result,
    };
  }

  async verifyWebhook(webhookBody) {
    if (!payos || process.env.SUBSCRIPTION_ALLOW_MOCK_PAYMENT === "true") {
      return webhookBody;
    }
    if (payos.webhooks?.verify) {
      return await payos.webhooks.verify(webhookBody);
    }
    return payos.verifyPaymentWebhookData(webhookBody);
  }

  async findByOrderCode(orderCode) {
    return SubscriptionPayment.findOne({ orderCode: Number(orderCode) });
  }

  async getPayOSPaymentStatus(orderCodeOrPaymentLinkId) {
    return await getPaymentLinkInfo(orderCodeOrPaymentLinkId);
  }

  async markSuccess(paymentRecord, payload = {}) {
    paymentRecord.status = SubscriptionPaymentStatus.SUCCESS;
    paymentRecord.paidAt = new Date();
    paymentRecord.transactionId = payload.transactionId || payload.transactionCode || payload.reference || paymentRecord.transactionId;
    paymentRecord.metadata = {
      ...(paymentRecord.metadata || {}),
      confirmedPayload: payload,
    };
    await paymentRecord.save();
    return paymentRecord;
  }

  async markFailed(paymentRecord, reason = "Payment failed", payload = {}) {
    paymentRecord.status = SubscriptionPaymentStatus.FAILED;
    paymentRecord.failureReason = reason;
    paymentRecord.metadata = {
      ...(paymentRecord.metadata || {}),
      failedPayload: payload,
    };
    await paymentRecord.save();
    return paymentRecord;
  }

  isSuccessPayload(payload = {}) {
    const status = String(payload.status || payload.paymentStatus || payload.code || "").toUpperCase();
    return status === "PAID" || status === "SUCCESS" || status === "SUCCESSFUL" || status === "00";
  }

  isCanceledPayload(payload = {}) {
    const canceled = payload.canceled === true || String(payload.cancel).toLowerCase() === "true";
    const status = String(payload.status || "").toUpperCase();
    return canceled || status === "CANCELLED" || status === "CANCELED";
  }

  isPendingPayload(payload = {}) {
    const status = String(payload.status || "").toUpperCase();
    return status === "PENDING" || status === "WAITING";
  }
}

module.exports = new SubscriptionPaymentService();
