const ApiResponse = require("../../utils/ApiResponse");
const subscriptionService = require("./subscription.service");

class SubscriptionController {
  async listPackages(req, res) {
    try {
      const packages = await subscriptionService.listPackages();
      return ApiResponse.success(res, packages, "Subscription packages loaded successfully");
    } catch (error) {
      console.error("[Subscription] listPackages:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async purchase(req, res) {
    try {
      const result = await subscriptionService.purchaseSubscription(req.user, req.body);
      return ApiResponse.success(res, result, "Subscription purchase created successfully", 201);
    } catch (error) {
      console.error("[Subscription] purchase:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getMy(req, res) {
    try {
      const subscriptions = await subscriptionService.getMySubscriptions(req.user);
      return ApiResponse.success(res, subscriptions, "Subscriptions loaded successfully");
    } catch (error) {
      console.error("[Subscription] getMy:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getById(req, res) {
    try {
      const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user);
      return ApiResponse.success(res, subscription, "Subscription loaded successfully");
    } catch (error) {
      console.error("[Subscription] getById:", error.message);
      const status = /not found/i.test(error.message) ? 404 : 400;
      return ApiResponse.error(res, error.message, status);
    }
  }

  async pause(req, res) {
    try {
      const result = await subscriptionService.pauseSubscription(req.params.id, req.user, req.body);
      return ApiResponse.success(res, result, "Subscription paused successfully");
    } catch (error) {
      console.error("[Subscription] pause:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async updatePreferredSchedule(req, res) {
    try {
      const result = await subscriptionService.updatePreferredSchedule(req.params.id, req.user, req.body);
      return ApiResponse.success(res, result, "Preferred schedule updated successfully");
    } catch (error) {
      console.error("[Subscription] updatePreferredSchedule:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async resume(req, res) {
    try {
      const result = await subscriptionService.resumeSubscription(req.params.id, req.user);
      return ApiResponse.success(res, result, "Subscription resumed successfully");
    } catch (error) {
      console.error("[Subscription] resume:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async cancel(req, res) {
    try {
      const result = await subscriptionService.cancelSubscription(req.params.id, req.user, req.body);
      return ApiResponse.success(res, result, "Subscription cancelled successfully");
    } catch (error) {
      console.error("[Subscription] cancel:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async renew(req, res) {
    try {
      const result = await subscriptionService.renewSubscription(req.params.id, req.user, req.body);
      return ApiResponse.success(res, result, "Subscription renewal processed successfully");
    } catch (error) {
      console.error("[Subscription] renew:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async remainingSessions(req, res) {
    try {
      const result = await subscriptionService.getSummaryForSubscription(req.params.id, req.user);
      return ApiResponse.success(res, result, "Remaining sessions loaded successfully");
    } catch (error) {
      console.error("[Subscription] remainingSessions:", error.message);
      const status = /not found/i.test(error.message) ? 404 : 400;
      return ApiResponse.error(res, error.message, status);
    }
  }

  async generateSessions(req, res) {
    try {
      const result = await subscriptionService.generateSessions(req.params.id, req.user, req.body);
      return ApiResponse.success(res, result, "Sessions generated successfully");
    } catch (error) {
      console.error("[Subscription] generateSessions:", error.message);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async handlePayosWebhook(req, res) {
    try {
      const result = await subscriptionService.handlePaymentWebhook(req.body);
      return res.status(200).json({ success: true, message: "Webhook processed", data: result });
    } catch (error) {
      console.error("[Subscription] webhook:", error.message);
      return res.status(200).json({ success: false, message: error.message });
    }
  }

  async paymentStatus(req, res) {
    try {
      const { orderCode } = req.query || {};
      const result = await subscriptionService.getPaymentStatusByOrderCode(orderCode, req.user);
      return ApiResponse.success(res, result, "Subscription payment loaded successfully");
    } catch (error) {
      console.error("[Subscription] paymentStatus:", error.message);
      const status = /not found/i.test(error.message) ? 404 : 400;
      return ApiResponse.error(res, error.message, status);
    }
  }
}

module.exports = new SubscriptionController();
