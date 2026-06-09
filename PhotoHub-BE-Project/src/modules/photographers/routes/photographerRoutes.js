// routes/photographerRoutes.js
const express = require("express");
const PhotographerController = require("../controllers/PhotographerController");
const { authenticate } = require("../../../middlewares/authenticate");
const bookingRoutes = require("../booking/booking.routes");
const calendarRoutes = require("../calendar/calendar.routes");
const jobRoutes = require("../job/job.routes");
const recommendationRoutes = require("../recommendation/recommendation.routes");

const router = express.Router();

// Public routes
router.get("/", PhotographerController.listPhotographers);
router.get("/search", PhotographerController.searchPhotographers);
router.get("/top", PhotographerController.getTopPhotographers);
router.get("/styles", PhotographerController.getStyles);
router.get("/locations", PhotographerController.getLocations);
router.get("/:id", PhotographerController.getPhotographerDetail);

router.use("/bookings", bookingRoutes);
router.use("/calendar", calendarRoutes);
router.use("/jobs/recommended", recommendationRoutes); // More specific first
router.use("/jobs", jobRoutes);

// Protected routes
router.post("/", authenticate, PhotographerController.createPhotographerProfile);
router.get("/me/profile", authenticate, PhotographerController.getMyPhotographerProfile);
router.put("/:id", authenticate, PhotographerController.updatePhotographerProfile);

module.exports = router;
