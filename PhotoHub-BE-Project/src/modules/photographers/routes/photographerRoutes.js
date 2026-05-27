// routes/photographerRoutes.js
const express = require("express");
const PhotographerController = require("../controllers/PhotographerController");
const { authenticate } = require("../../../middlewares/authenticate");

const router = express.Router();

// Public routes
router.get("/search", PhotographerController.searchPhotographers);
router.get("/top", PhotographerController.getTopPhotographers);
router.get("/styles", PhotographerController.getStyles);
router.get("/locations", PhotographerController.getLocations);
router.get("/:id", PhotographerController.getPhotographerDetail);

// Protected routes
router.post("/", authenticate, PhotographerController.createPhotographerProfile);
router.put("/:id", authenticate, PhotographerController.updatePhotographerProfile);
router.get("/me/profile", authenticate, PhotographerController.getMyPhotographerProfile);

module.exports = router;
