const mongoose = require("mongoose");

const resumeAnalysisSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      // Flexible payload: the Python AI service defines the analysis shape
      analysis: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

const ResumeAnalysis = mongoose.model(
  "ResumeAnalysis",
  resumeAnalysisSchema
);

module.exports = ResumeAnalysis;
