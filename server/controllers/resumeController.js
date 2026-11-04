const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");

const getUploadsDir = () =>
  path.join(__dirname, "..", "uploads");

const safeDownloadName = (value) => {
  const cleaned = String(value || "")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .trim();

  return cleaned
    ? cleaned.slice(-100)
    : "resume";
};

// Authenticated, ownership-checked resume file delivery
// (replaces public /uploads static access)
const getResumeFile = async (req, res) => {
  try {
    let resume;

    const fileId = req.query.id;

    if (fileId) {
      if (
        !mongoose.isValidObjectId(fileId)
      ) {
        return res.status(404).json({
          message: "Resume not found",
        });
      }

      resume = await Resume.findOne({
        _id: fileId,
        userId: req.user.id,
      });
    } else {
      resume = await Resume.findOne({
        userId: req.user.id,
      }).sort({ createdAt: -1 });
    }

    if (!resume || !resume.filePath) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Defense in depth: only files inside uploads/ can be
    // served, never arbitrary paths (traversal guard)
    const uploadsDir = path.resolve(
      getUploadsDir()
    );

    const resolvedFile = path.resolve(
      resume.filePath
    );

    if (
      resolvedFile !== uploadsDir &&
      !resolvedFile.startsWith(
        uploadsDir + path.sep
      )
    ) {
      console.error(
        "RESUME FILE PATH ESCAPE BLOCKED:",
        resolvedFile
      );

      return res.status(404).json({
        message: "Resume not found",
      });
    }

    if (!fs.existsSync(resolvedFile)) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    res.download(
      resolvedFile,
      safeDownloadName(resume.fileName)
    );
  } catch (error) {
    console.error(
      "RESUME FILE SERVE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a resume file",
      });
    }

    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({
      message: "Resume uploaded successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error("RESUME UPLOAD ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!resume) {
      return res.status(404).json({
        message: "No resume found",
      });
    }

    res.status(200).json({
      message: "Resume fetched successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error("RESUME FETCH ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


// Internal: Python AI service posts analysis results here (serviceAuth, no user JWT)
const saveResumeAnalysis = async (
  req,
  res
) => {
  try {
    const payload = req.body || {};

    if (
      !payload.userId ||
      !mongoose.isValidObjectId(
        payload.userId
      )
    ) {
      return res.status(400).json({
        message:
          "A valid userId is required",
      });
    }

    if (
      !payload.analysis ||
      typeof payload.analysis !==
        "object" ||
      Array.isArray(payload.analysis)
    ) {
      return res.status(400).json({
        message: "analysis is required",
      });
    }

    const savedAnalysis =
      await ResumeAnalysis.create({
        userId: payload.userId,
        analysis: payload.analysis,
      });

    res.status(201).json({
      message:
        "Resume analysis saved successfully",
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error(
      "AI RESUME ANALYSIS SAVE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getResumeAnalyses = async (
  req,
  res
) => {
  try {
    const analyses =
      await ResumeAnalysis.find({
        userId: req.user.id,
      }).sort({ createdAt: -1 });

    res.status(200).json({
      message:
        "Resume analyses fetched successfully",
      analyses,
    });
  } catch (error) {
    console.error(
      "AI RESUME ANALYSES FETCH ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  uploadResume,
  getResume,
  getResumeFile,
  saveResumeAnalysis,
  getResumeAnalyses,
};