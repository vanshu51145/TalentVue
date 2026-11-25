const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");
const serviceAuth = require("../middleware/serviceAuth");
const {
  transcribeInterviewAnswer,
  generateInterviewReport,
  generateInterviewQuestions,
  generateAdaptiveFollowup,
  createInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
  deleteAllInterviews,
  scoreInterview,
} = require("../controllers/interviewController");

const router = express.Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const isAudio =
      /^audio\//.test(file.mimetype) ||
      /\.(webm|wav|mp3|m4a|ogg)$/i.test(
        file.originalname || ""
      );

    if (!isAudio) {
      const error = new Error(
        "Only audio recordings are supported"
      );

      error.statusCode = 400;

      return callback(error);
    }

    callback(null, true);
  },
});

const transcribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    message:
      "Too many audio transcription requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many interview report requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const questionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many interview question requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const followUpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    message:
      "Too many adaptive follow-up requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/generate-questions",
  protect,
  questionLimiter,
  generateInterviewQuestions
);

router.post(
  "/generate-followup",
  protect,
  followUpLimiter,
  generateAdaptiveFollowup
);

router.post(
  "/transcribe",
  protect,
  transcribeLimiter,
  audioUpload.single("audio"),
  transcribeInterviewAnswer
);

router.post(
  "/generate-report",
  protect,
  reportLimiter,
  generateInterviewReport
);

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
