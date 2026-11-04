const mongoose = require("mongoose");

const InterviewSession = require("../models/InterviewSession");

const isInvalidId = (value) =>
  !mongoose.isValidObjectId(value);

const createInterview = async (
  req,
  res
) => {
  // userId comes ONLY from the JWT; request body userId is ignored
  const payload = req.body || {};

  const answers = Array.isArray(
    payload.answers
  )
    ? payload.answers
    : null;

  if (
    !payload.sessionId ||
    !payload.setup ||
    typeof payload.setup !==
      "object" ||
    !answers
  ) {
    return res.status(400).json({
      message:
        "sessionId, setup and answers are required",
    });
  }

  if (payload.completedAt && Number.isNaN(Date.parse(payload.completedAt))) {
    return res.status(400).json({
      message: "Invalid completedAt timestamp",
    });
  }

  const query = {
    userId: req.user.id,
    sessionId: payload.sessionId,
  };

  const sessionFields = {
    setup: payload.setup,
    answers,
    totalQuestions:
      Number(payload.totalQuestions) ||
      answers.length,
    answeredQuestions:
      Number(payload.answeredQuestions) ||
      0,
    skippedQuestions:
      Number(payload.skippedQuestions) ||
      0,
    completedAt:
      payload.completedAt ||
      new Date().toISOString(),
    status:
      payload.status || "completed",
  };

  try {
    const existing =
      await InterviewSession.findOne(
        query
      );

    if (existing) {
      return res.status(200).json({
        message:
          "Interview already saved",
        interview: existing,
      });
    }

    const interview =
      await InterviewSession.create({
        ...query,
        ...sessionFields,
      });

    res.status(201).json({
      message:
        "Interview saved successfully",
      interview,
    });
  } catch (error) {
    // Duplicate-safe: race between two identical POSTs
    if (
      error &&
      error.code === 11000
    ) {
      try {
        const existing =
          await InterviewSession.findOne(
            query
          );

        if (existing) {
          return res
            .status(200)
            .json({
              message:
                "Interview already saved",
              interview: existing,
            });
        }
      } catch (nestedError) {
        console.error(
          "INTERVIEW DUPLICATE LOOKUP ERROR:",
          nestedError
        );
      }
    }

    console.error(
      "INTERVIEW CREATE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getInterviews = async (
  req,
  res
) => {
  try {
    const interviews =
      await InterviewSession.find({
        userId: req.user.id,
      }).sort({ completedAt: -1 });

    res.status(200).json({
      message:
        "Interviews fetched successfully",
      interviews,
    });
  } catch (error) {
    console.error(
      "INTERVIEWS FETCH ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getInterviewById = async (
  req,
  res
) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const interview =
      await InterviewSession.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    res.status(200).json({
      message:
        "Interview fetched successfully",
      interview,
    });
  } catch (error) {
    console.error(
      "INTERVIEW FETCH ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteInterview = async (
  req,
  res
) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const interview =
      await InterviewSession.findOneAndDelete(
        {
          _id: req.params.id,
          userId: req.user.id,
        }
      );

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    res.status(200).json({
      message:
        "Interview deleted successfully",
    });
  } catch (error) {
    console.error(
      "INTERVIEW DELETE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteAllInterviews = async (
  req,
  res
) => {
  try {
    const result =
      await InterviewSession.deleteMany(
        { userId: req.user.id }
      );

    res.status(200).json({
      message:
        "Interview history cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      "INTERVIEWS CLEAR ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Internal: Python AI service posts scores here (serviceAuth, no user JWT)
const scoreInterview = async (
  req,
  res
) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const payload = req.body || {};

    if (payload.score === undefined) {
      return res.status(400).json({
        message: "score is required",
      });
    }

    const interview =
      await InterviewSession.findById(
        req.params.id
      );

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    interview.aiScore = payload.score;

    interview.aiScoredAt = new Date();

    await interview.save();

    res.status(200).json({
      message:
        "Interview score saved successfully",
      interview,
    });
  } catch (error) {
    console.error(
      "INTERVIEW SCORE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
  deleteAllInterviews,
  scoreInterview,
};
