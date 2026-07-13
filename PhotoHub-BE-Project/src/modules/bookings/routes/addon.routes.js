const express = require("express");
const router = express.Router();
const AddonController = require("../controllers/AddonController");
const authenticate = require("../../../middlewares/authenticate");

router.get("/:bookingId", authenticate, (req, res) => AddonController.getAddonByBookingId(req, res));
router.post("/:bookingId", authenticate, (req, res) => AddonController.createOrUpdateAddon(req, res));

module.exports = router;
