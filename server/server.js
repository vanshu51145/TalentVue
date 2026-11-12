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

// Fail fast when the CORS allowlist is missing or malformed so a
// misconfigured deploy never silently falls back to wildcard CORS
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

const corsOriginsValid = corsOrigins.every((origin) =>
  /^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(origin)
);

if (!corsOrigins.length || !corsOriginsValid) {
  console.error(
    "CORS_ORIGINS is missing or invalid. Set a comma-separated list of exact origins, e.g. https://yourapp.vercel.app,http://localhost:5173"
  );
  process.exit(1);
}

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

// Render fronts each service with exactly one reverse-proxy hop.
// Trust one hop so req.ip resolves to the proxy-appended real
// client IP (rightmost X-Forwarded-For entry); client-supplied,
// spoofed X-Forwarded-For prefixes stay untrusted and cannot
// influence rate-limit buckets.
app.set("trust proxy", 1);

app.use(
  helmet({
    // CSP disabled: Vite dev runtime and React app would be blocked by default CSP in dev
    contentSecurityPolicy: false,
  })
);
// Same allowlist semantics as the boot check: exact-match against
// CORS_ORIGINS entries; requests without an Origin header (server
// to server, health checks, curl) are allowed through. Methods and
// headers keep the cors() defaults (Authorization + Content-Type are
// reflected on preflight); credentials stay disabled (Bearer token
// auth is used, no cookies).
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");
      error.statusCode = 403;
      return callback(error);
    },
  })
);
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