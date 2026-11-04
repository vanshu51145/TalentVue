const errorHandler = (
  err,
  req,
  res,
  next
) => {
  let status = 500;
  let message = "Server error";

  const type = err && err.type;
  const name = err && err.name;
  const code = err && err.code;
  const statusCode =
    err && typeof err.statusCode === "number"
      ? err.statusCode
      : null;

  if (
    type === "entity.parse.failed" ||
    (name === "SyntaxError" &&
      err.status === 400)
  ) {
    status = 400;
    message = "Invalid JSON format";
  } else if (type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  } else if (name === "MulterError") {
    if (code === "LIMIT_FILE_SIZE") {
      status = 413;
      message =
        "File is too large. Maximum size is 5MB.";
    } else {
      status = 400;
      message = "File upload failed. Please try again.";
    }
  } else if (
    statusCode !== null &&
    statusCode >= 400 &&
    statusCode < 500
  ) {
    status = statusCode;
    message = err.message || message;
  }

  if (status === 500) {
    console.error(
      "UNEXPECTED SERVER ERROR:",
      err
    );
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    message,
  });
};

module.exports = errorHandler;
