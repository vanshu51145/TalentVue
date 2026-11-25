const express = require("express");
const rateLimit = require("express-rate-limit");

const protect = require("../middleware/authMiddleware");
const serviceAuth = require("../middleware/serviceAuth");
const {
  handleResumeUpload,
} = require("../middleware/uploadMiddleware");

const {
  uploadResume,
  getResume,
  getResumeFile,
  saveResumeAnalysis,
  getResumeAnalyses,
  analyzeResumeWithAI,
} = require("../controllers/resumeController");

const router = express.Router();

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many resume analyses. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


router.post(
  "/upload",
  protect,
  handleResumeUpload,
  uploadResume
);

// Authenticated, ownership-checked resume file delivery
// (replaces public /uploads static serving)
router.get(
  "/file",
  protect,
  getResumeFile
);

// Internal: called by the Python AI service
router.post(
  "/analysis",
  serviceAuth,
  saveResumeAnalysis
);

router.get(
  "/analysis",
  protect,
  getResumeAnalyses
);

router.post(
  "/analyze",
  protect,
  analyzeLimiter,
  analyzeResumeWithAI
);


router.get(
  "/",
  protect,
  getResume
);


module.exports = router;