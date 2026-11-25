const fs = require("fs/promises");
const path = require("path");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const uploadsDir = path.resolve(
  __dirname,
  "..",
  "uploads"
);

const fileError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeText = (text) => {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 80) {
    throw fileError(
      "Could not extract enough text from this resume for AI analysis.",
      422
    );
  }

  return cleaned.slice(0, 16000);
};

const extractResumeText = async (resume) => {
  const resolvedFile = path.resolve(
    resume.filePath
  );

  if (
    resolvedFile !== uploadsDir &&
    !resolvedFile.startsWith(
      uploadsDir + path.sep
    )
  ) {
    throw fileError(
      "Resume file path is invalid.",
      404
    );
  }

  let buffer;

  try {
    buffer = await fs.readFile(resolvedFile);
  } catch {
    throw fileError(
      "Resume file not found on the server.",
      404
    );
  }

  const extension = path
    .extname(resume.fileName || "")
    .toLowerCase();

  if (
    extension === ".pdf" ||
    resume.fileType === "application/pdf"
  ) {
    try {
      const result = await pdfParse(buffer);
      return normalizeText(result.text);
    } catch {
      throw fileError(
        "Could not read this PDF resume.",
        422
      );
    }
  }

  if (
    extension === ".docx" ||
    String(resume.fileType || "").includes(
      "wordprocessingml"
    )
  ) {
    try {
      const result = await mammoth.extractRawText({
        buffer,
      });

      return normalizeText(result.value);
    } catch {
      throw fileError(
        "Could not read this DOCX resume.",
        422
      );
    }
  }

  throw fileError(
    "AI review supports PDF and DOCX resumes only.",
    400
  );
};

module.exports = { extractResumeText };
