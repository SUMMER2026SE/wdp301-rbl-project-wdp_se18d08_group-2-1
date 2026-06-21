const express = require("express");
const calendarController = require("./calendar.controller");
const { authenticate } = require("../../../middlewares/authenticate");
const authorize = require("../../../middlewares/roleMiddlewares");

const router = express.Router();

router.get("/", authenticate, authorize(["photographer"]), calendarController.getCalendar);
router.get("/photographer/:photographerId", authenticate, calendarController.getPhotographerCalendar);

module.exports = router;
