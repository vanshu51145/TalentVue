const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const projectRoutes = require("./routes/projectRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const errorHandler = require("./middleware/errorHandler");
dotenv.config();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

app.use(
  helmet({
    // CSP disabled: Vite dev runtime and React app would be blocked by default CSP in dev
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/interviews", interviewRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "TalentVue AI Backend is running",
  });
});

// JSON 404 for any unmatched route (uploaded files are served
// through the authenticated /api/resume/file endpoint)
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Centralized JSON error handler — no stack traces, paths
// or internals in responses; full details stay in server logs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});