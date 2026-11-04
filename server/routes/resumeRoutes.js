const express = require("express");

const protect = require("../middleware/authMiddleware");
const serviceAuth = require("../middleware/serviceAuth");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadResume,
  getResume,
  getResumeFile,
  saveResumeAnalysis,
  getResumeAnalyses,
} = require("../controllers/resumeController");

const router = express.Router();


router.post(
  "/upload",
  protect,
  upload.single("resume"),
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


router.get(
  "/",
  protect,
  getResume
);


module.exports = router;