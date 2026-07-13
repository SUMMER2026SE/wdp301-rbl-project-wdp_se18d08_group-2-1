const MarketingEvent = require("../models/MarketingEvent");
const ApiResponse = require("../../../utils/ApiResponse");

class EventController {
  async listEvents(req, res) {
    try {
      const { status } = req.query;
      const query = {};
      if (status) {
        query.status = status;
      }
      const events = await MarketingEvent.find(query).sort({ startDate: -1 });
      return ApiResponse.success(res, events, "Get marketing events successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getEventDetail(req, res) {
    try {
      const event = await MarketingEvent.findById(req.params.id);
      if (!event) {
        return ApiResponse.error(res, "Event not found", 404);
      }
      return ApiResponse.success(res, event, "Get event detail successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async createEvent(req, res) {
    try {
      const { title, description, banner, startDate, endDate, location } = req.body;
      if (!title || !description || !startDate || !endDate) {
        return ApiResponse.error(res, "Title, description, startDate, and endDate are required", 400);
      }

      const event = new MarketingEvent({
        title,
        description,
        banner,
        startDate,
        endDate,
        location,
      });

      await event.save();
      return ApiResponse.success(res, event, "Marketing event created successfully", 201);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new EventController();
