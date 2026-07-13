const express = require("express");
const router = express.Router();
const BlogController = require("../controllers/BlogController");
const authenticate = require("../../../middlewares/authenticate");

router.get("/", (req, res) => BlogController.listBlogs(req, res));
router.get("/:id", (req, res) => BlogController.getBlogDetail(req, res));
router.post("/", authenticate, (req, res) => BlogController.createBlog(req, res));
router.post("/:id/like", authenticate, (req, res) => BlogController.likeBlog(req, res));

module.exports = router;
