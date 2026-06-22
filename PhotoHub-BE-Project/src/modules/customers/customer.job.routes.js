const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/roleMiddlewares");
const jobPostUpload = require("../../middlewares/jobPostUpload.middleware");
const customerJobController = require("./customer.job.controller");

router.use(authenticate, authorize(["customer"]));

router.get("/", customerJobController.getMyJobPosts);

router.post(
  "/",
  jobPostUpload.array("referenceImages", 5),
  customerJobController.createJobPost
);

router.post(
  "/:id/images",
  jobPostUpload.array("referenceImages", 5),
  customerJobController.uploadReferenceImages
);

router.delete("/:id", customerJobController.deleteJobPost);

router.patch("/:id/close", customerJobController.closeJobPost);

module.exports = router;
