const crypto = require("crypto");

const serviceAuth = (
  req,
  res,
  next
) => {
  const key =
    process.env.INTERNAL_API_KEY;

  // Fail closed when the service key is not configured
  if (!key) {
    return res.status(503).json({
      message:
        "AI service not configured",
    });
  }

  const provided =
    req.headers["x-internal-key"];

  if (
    typeof provided !== "string" ||
    provided.length === 0
  ) {
    return res.status(401).json({
      message: "Unauthorized service",
    });
  }

  // Hash both sides so timingSafeEqual always gets equal-length
  // buffers; comparison stays constant-time and never leaks
  // the expected key or its length
  const expectedHash = crypto
    .createHash("sha256")
    .update(String(key), "utf8")
    .digest();

  const providedHash = crypto
    .createHash("sha256")
    .update(provided, "utf8")
    .digest();

  if (
    !crypto.timingSafeEqual(
      expectedHash,
      providedHash
    )
  ) {
    return res.status(401).json({
      message: "Unauthorized service",
    });
  }

  next();
};

module.exports = serviceAuth;
