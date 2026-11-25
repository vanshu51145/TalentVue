const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    projectType: {
      type: String,
      required: true,
      enum: [
        "Personal",
        "Academic",
        "Internship",
        "Team",
        "Hackathon",
      ],
      default: "Personal",
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    technologies: {
      type: [String],
      required: true,
    },

    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },

    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },

    contribution: {
      type: String,
      required: true,
      trim: true,
    },

    challenges: {
      type: String,
      trim: true,
      default: "",
    },

    outcome: {
      type: String,
      trim: true,
      default: "",
    },

    evidenceFiles: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Project",
  projectSchema
);
