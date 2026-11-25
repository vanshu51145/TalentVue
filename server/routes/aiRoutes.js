const express = require("express");
const rateLimit = require("express-rate-limit");

const protect = require("../middleware/authMiddleware");
const { chat } = require("../controllers/aiController");

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    message:
      "Too many AI requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/chat", protect, chatLimiter, chat);

module.exports = router;
