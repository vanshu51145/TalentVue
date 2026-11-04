const express = require("express");

const protect = require("../middleware/authMiddleware");
const serviceAuth = require("../middleware/serviceAuth");
const {
  createInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
  deleteAllInterviews,
  scoreInterview,
} = require("../controllers/interviewController");

const router = express.Router();

router.post(
  "/",
  protect,
  createInterview
);

// Internal: called by the Python AI service
router.post(
  "/:id/score",
  serviceAuth,
  scoreInterview
);

router.get(
  "/",
  protect,
  getInterviews
);

// Clear-all must be registered before "/:id" for DELETE safety
router.delete(
  "/",
  protect,
  deleteAllInterviews
);

router.get(
  "/:id",
  protect,
  getInterviewById
);

router.delete(
  "/:id",
  protect,
  deleteInterview
);

module.exports = router;
