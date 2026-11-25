const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1E9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// Extension -> allowed MIME types. A generic upload is only
// accepted when the extension itself is one of these formats.
const allowedTypes = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const genericTypes = [
  "",
  "application/octet-stream",
];

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  const mimeType = String(file.mimetype || "")
    .toLowerCase();

  const allowedMimes = allowedTypes[extension];

  const isAllowed =
    Boolean(allowedMimes) &&
    (allowedMimes.includes(mimeType) ||
      genericTypes.includes(mimeType));

  if (isAllowed) {
    cb(null, true);
  } else {
    const error = new Error(
      "Only PDF, DOC and DOCX files are allowed"
    );

    error.statusCode = 400;

    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Normalize the resume size error so the client always gets the
// exact user-facing limit message. Other uploaders keep their
// existing generic error handling.
const handleResumeUpload = (req, res, next) => {
  upload.single("resume")(req, res, (error) => {
    if (error && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File size must not exceed 10 MB.",
      });
    }

    if (error) {
      return next(error);
    }

    next();
  });
};

module.exports = { upload, handleResumeUpload };
