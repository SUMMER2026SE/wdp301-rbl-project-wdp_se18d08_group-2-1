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
}

module.exports = new CalendarController();
