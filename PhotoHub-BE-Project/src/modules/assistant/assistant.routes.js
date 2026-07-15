const router = require("express").Router();
const controller = require("./assistant.controller");

router.post("/chat", controller.chat.bind(controller));

module.exports = router;
