const calendarService = require("./calendar.service");
const ApiResponse = require("../../../utils/ApiResponse");

class CalendarController {
  async getCalendar(req, res) {
    try {
      const events = await calendarService.getCalendarEvents(req.user.id, req.query);
      return ApiResponse.success(res, events, "Calendar events retrieved successfully");
    } catch (error) {
      console.error("Error retrieving calendar events:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }

  async getPhotographerCalendar(req, res) {
    try {
      const { photographerId } = req.params;
      const Photographer = require("../models/photographer");
      const photographer = await Photographer.findById(photographerId);
      if (!photographer) {
        return ApiResponse.error(res, "Photographer not found", 404);
      }
      const events = await calendarService.getCalendarEvents(photographer.user, req.query);
      return ApiResponse.success(res, events, "Photographer calendar events retrieved successfully");
    } catch (error) {
      console.error("Error retrieving photographer calendar:", error);
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = new CalendarController();
