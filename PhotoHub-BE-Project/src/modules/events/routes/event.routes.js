const express = require("express");
const router = express.Router();
const EventController = require("../controllers/EventController");
const authenticate = require("../../../middlewares/authenticate");

router.get("/", (req, res) => EventController.listEvents(req, res));
router.get("/:id", (req, res) => EventController.getEventDetail(req, res));
router.post("/", authenticate, (req, res) => EventController.createEvent(req, res));

module.exports = router;
