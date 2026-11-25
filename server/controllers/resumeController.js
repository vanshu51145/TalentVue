const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const { requestJson } = require("../services/aiService");
const {
  extractResumeText,
} = require("../utils/resumeText");
const {
  createNotification,
} = require("../services/notificationService");

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

    await createNotification({
      userId: req.user.id,
      type: "resume_uploaded",
      title: "Resume uploaded",
      message: `Your resume "${resume.fileName}" was uploaded successfully.`,
      link: "/dashboard/resume",
      metadata: {
        resumeId: resume._id.toString(),
        fileName: resume.fileName,
      },
      dedupeKey: `resume:${resume._id}`,
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

const stringArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);
};

const normalizeAnalysis = (raw) => {
  const numericScore = Number(raw && raw.score);
  const score = Number.isFinite(numericScore)
    ? Math.max(0, Math.min(100, Math.round(numericScore)))
    : 0;

  return {
    score,
    profileType:
      String(
        (raw && raw.profileType) ||
          "Profile not specified"
      )
        .trim()
        .slice(0, 120),
    skills: stringArray(raw && raw.skills),
    projects: stringArray(raw && raw.projects),
    strengths: stringArray(raw && raw.strengths),
    improvements: stringArray(
      raw && raw.improvements
    ),
  };
};

// User-facing AI review: reads the authenticated user's
// uploaded resume and stores real model output
const analyzeResumeWithAI = async (
  req,
  res
) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!resume) {
      return res.status(404).json({
        message:
          "No resume found. Upload a resume first.",
      });
    }

    const resumeText = await extractResumeText(
      resume
    );

    const rawAnalysis = await requestJson({
      messages: [
        {
          role: "system",
          content:
            "You are a strict resume reviewer. Return ONLY valid JSON, with no markdown and no explanation, using exactly these keys: score (number from 0 to 100), profileType (string), skills (array of strings), projects (array of strings), strengths (array of strings), improvements (array of strings). Base every field only on the provided resume text. Score the resume's clarity, skill coverage, project detail and measurable impact using the full 0-100 range; do not default to a low score. Keep each string under 120 characters. Return 3 to 8 items in each array.",
        },
        {
          role: "user",
          content: `Resume text:\n${resumeText}`,
        },
      ],
      maxTokens: 1200,
      temperature: 0.2,
    });

    const analysis = normalizeAnalysis(
      rawAnalysis
    );

    const savedAnalysis =
      await ResumeAnalysis.create({
        userId: req.user.id,
        analysis,
      });

    res.status(201).json({
      message:
        "AI resume analysis completed",
      analysisId: savedAnalysis._id,
      analysis,
    });
  } catch (error) {
    if (
      error &&
      typeof error.statusCode === "number"
    ) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }

    console.error(
      "AI RESUME ANALYSIS ERROR:",
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
  analyzeResumeWithAI,
};