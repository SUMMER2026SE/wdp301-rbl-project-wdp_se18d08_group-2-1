// routes/photographerRoutes.js
const express = require("express");
const PhotographerController = require("../controllers/PhotographerController");
const { authenticate } = require("../../../middlewares/authenticate");
const bookingRoutes = require("../booking/booking.routes");

const router = express.Router();

// Public routes
router.get("/", PhotographerController.listPhotographers);
router.get("/search", PhotographerController.searchPhotographers);
router.get("/top", PhotographerController.getTopPhotographers);
router.get("/styles", PhotographerController.getStyles);
router.get("/locations", PhotographerController.getLocations);
router.get("/:id", PhotographerController.getPhotographerDetail);

router.use("/bookings", bookingRoutes);

// Protected routes
router.post("/", authenticate, PhotographerController.createPhotographerProfile);
router.get("/me/profile", authenticate, PhotographerController.getMyPhotographerProfile);
router.put("/:id", authenticate, PhotographerController.updatePhotographerProfile);

module.exports = router;
