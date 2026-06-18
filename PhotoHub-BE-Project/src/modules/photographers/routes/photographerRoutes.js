// routes/photographerRoutes.js
const express = require("express");
const PhotographerController = require("../controllers/PhotographerController");
const { authenticate } = require("../../../middlewares/authenticate");
const bookingRoutes = require("../booking/booking.routes");
const calendarRoutes = require("../calendar/calendar.routes");
const jobRoutes = require("../job/job.routes");
const recommendationRoutes = require("../recommendation/recommendation.routes");
const bidRoutes = require("../bid/bid.routes");
const chatRoutes = require("../chat/chat.routes");
const albumRoutes = require("../album/album.routes");
const revenueRoutes = require("../revenue/revenue.routes");
const withdrawRoutes = require("../withdraw/withdraw.routes");
const uploadVerification = require("../../../middlewares/uploadVerification");
const router = express.Router();

// Mount specific sub-routes first so they don't get intercepted by wildcard parameter /:id
router.use("/bookings", bookingRoutes);
router.use("/calendar", calendarRoutes);
router.use("/jobs/recommended", recommendationRoutes); // More specific first
router.use("/jobs", jobRoutes);
router.use("/bids", bidRoutes);
router.use("/chat", chatRoutes);
router.use("/albums", albumRoutes);
router.use("/revenue", revenueRoutes);
router.use("/withdraw", withdrawRoutes);

// Public routes
router.get("/", PhotographerController.listPhotographers);
router.get("/search", PhotographerController.searchPhotographers);
router.get("/top", PhotographerController.getTopPhotographers);
router.get("/styles", PhotographerController.getStyles);
router.get("/categories", PhotographerController.getCategories);
router.get("/locations", PhotographerController.getLocations);
router.get("/:id", PhotographerController.getPhotographerDetail);

// Protected routes
router.post("/", authenticate, PhotographerController.createPhotographerProfile);
router.get("/me/profile", authenticate, PhotographerController.getMyPhotographerProfile);
router.put("/:id", authenticate, PhotographerController.updatePhotographerProfile);
router.post(
  "/me/verification",
  authenticate,
  uploadVerification.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  PhotographerController.uploadVerification
);

router.get(
  "/me/profile-status",
  authenticate,
  PhotographerController.getProfileStatus
);

module.exports = router;
