const mongoose = require("mongoose");

const setupSchema = new mongoose.Schema(
  {
    targetRole: String,

    interviewType: String,

    difficulty: String,

    experienceLevel: String,

    questionCount: String,

    duration: String,

    selectedProjectTitle: String,
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: Number,

    question: String,

    category: String,

    answer: String,

    hasAudio: Boolean,

    recordingDuration: Number,

    skipped: Boolean,

    answeredAt: String,
  },
  {
    _id: false,
    strict: false,
  }
);

const interviewSessionSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      sessionId: {
        type: Number,
        required: true,
      },

      setup: {
        type: setupSchema,
        required: true,
      },

      answers: {
        type: [answerSchema],
        required: true,
      },

      totalQuestions: {
        type: Number,
        required: true,
      },

      answeredQuestions: {
        type: Number,
        default: 0,
      },

      skippedQuestions: {
        type: Number,
        default: 0,
      },

      completedAt: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        default: "completed",
      },

      // Written only by the future Python AI service (see serviceAuth);
      // shape decided by that service, stored as-is
      aiScore: {
        type: mongoose.Schema.Types.Mixed,
      },

      aiScoredAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

interviewSessionSchema.index(
  { userId: 1, sessionId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);
