const mongoose = require("mongoose");

const InterviewSession = require("../models/InterviewSession");
const Project = require("../models/Project");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const {
  requestJson,
  transcribeAudio,
} = require("../services/aiService");
const {
  extractResumeText,
} = require("../utils/resumeText");
const {
  createNotification,
} = require("../services/notificationService");

const isInvalidId = (value) =>
  !mongoose.isValidObjectId(value);

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const boundedText = (
  value,
  maxLength = 1200
) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const boundedArray = (
  value,
  maxItems = 10,
  maxLength = 140
) =>
  Array.isArray(value)
    ? value
        .map((item) =>
          boundedText(item, maxLength)
        )
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

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

  if (
    payload.aiScore &&
    typeof payload.aiScore ===
      "object" &&
    !Array.isArray(payload.aiScore)
  ) {
    sessionFields.aiScore = payload.aiScore;
    sessionFields.aiScoredAt =
      payload.aiScoredAt &&
      !Number.isNaN(
        Date.parse(payload.aiScoredAt)
      )
        ? payload.aiScoredAt
        : new Date().toISOString();
  }

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

    await createNotification({
      userId: req.user.id,
      type: "interview_completed",
      title: "Interview completed",
      message: `Your ${
        payload.setup?.targetRole ||
        "mock"
      } interview was completed successfully.`,
      link: "/dashboard/interviews",
      metadata: {
        sessionId: payload.sessionId,
        targetRole:
          payload.setup?.targetRole || "",
      },
      dedupeKey: `interview:${payload.sessionId}`,
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

const buildResumeEvidence = async (
  userId
) => {
  const [resume, analysisRecord] =
    await Promise.all([
      Resume.findOne({
        userId,
      }).sort({ createdAt: -1 }),
      ResumeAnalysis.findOne({
        userId,
      }).sort({ createdAt: -1 }),
    ]);

  if (!resume && !analysisRecord) {
    return null;
  }

  const analysis =
    (analysisRecord && analysisRecord.analysis) ||
    {};

  const parts = [];

  if (analysis.profileType) {
    parts.push(
      `Profile: ${boundedText(
        analysis.profileType,
        160
      )}`
    );
  }

  const skills = boundedArray(
    analysis.skills,
    12
  );

  if (skills.length) {
    parts.push(
      `Skills: ${skills.join(", ")}`
    );
  }

  const projects = boundedArray(
    analysis.projects,
    8
  );

  if (projects.length) {
    parts.push(
      `Projects: ${projects.join(", ")}`
    );
  }

  const strengths = boundedArray(
    analysis.strengths,
    6
  );

  if (strengths.length) {
    parts.push(
      `Strengths: ${strengths.join(", ")}`
    );
  }

  const improvements = boundedArray(
    analysis.improvements,
    6
  );

  if (improvements.length) {
    parts.push(
      `Improvements: ${improvements.join(", ")}`
    );
  }

  if (parts.length) {
    return boundedText(
      parts.join(". "),
      6000
    );
  }

  if (!resume) {
    return null;
  }

  try {
    const resumeText =
      await extractResumeText(resume);

    return boundedText(resumeText, 6000);
  } catch {
    return null;
  }
};

const buildProjectEvidence = async (
  userId,
  setup
) => {
  if (!setup.useProjectEvidence) {
    return null;
  }

  let project = null;

  if (
    mongoose.isValidObjectId(
      setup.selectedProjectId
    )
  ) {
    project = await Project.findOne({
      _id: setup.selectedProjectId,
      userId,
    });
  }

  if (
    !project &&
    boundedText(setup.selectedProjectTitle, 200)
  ) {
    project = await Project.findOne({
      userId,
      title: boundedText(
        setup.selectedProjectTitle,
        200
      ),
    }).sort({ createdAt: -1 });
  }

  if (!project) {
    return null;
  }

  const parts = [
    `Project: ${boundedText(
      project.title,
      180
    )}`,
    `Type: ${boundedText(
      project.projectType,
      80
    )}`,
    `Role: ${boundedText(
      project.role,
      160
    )}`,
    `Description: ${boundedText(
      project.description,
      900
    )}`,
    `Technologies: ${boundedArray(
      project.technologies,
      12
    ).join(", ")}`,
    `Contribution: ${boundedText(
      project.contribution,
      700
    )}`,
  ];

  const challenges = boundedText(
    project.challenges,
    600
  );

  if (challenges) {
    parts.push(`Challenges: ${challenges}`);
  }

  const outcome = boundedText(
    project.outcome,
    600
  );

  if (outcome) {
    parts.push(`Outcome: ${outcome}`);
  }

  return boundedText(
    parts.join(". "),
    4000
  );
};

const normalizeGeneratedQuestions = (
  raw,
  requestedCount
) => {
  const list = Array.isArray(
    raw && raw.questions
  )
    ? raw.questions
    : Array.isArray(raw)
      ? raw
      : [];

  const seen = new Set();
  const questions = [];

  for (const item of list) {
    const question = boundedText(
      item && (item.question || item.text),
      320
    );

    if (question.length < 12) {
      continue;
    }

    const key = question.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    questions.push({
      id: questions.length + 1,
      category:
        boundedText(
          item && item.category,
          80
        ) || "General",
      question,
      hint: boundedText(
        item &&
          (item.hint ||
            item.expectedFocus ||
            item.focus),
        260
      ),
    });

    if (questions.length === requestedCount) {
      break;
    }
  }

  if (!questions.length) {
    throw httpError(
      "AI service did not return usable interview questions.",
      502
    );
  }

  return questions;
};

const generateInterviewQuestions = async (
  req,
  res
) => {
  try {
    const payload =
      (req.body && req.body.setup) ||
      req.body ||
      {};

    const targetRole = boundedText(
      payload.targetRole,
      160
    );

    if (!targetRole) {
      return res.status(400).json({
        message:
          "targetRole is required to generate interview questions",
      });
    }

    const requestedNumber = Number(
      payload.questionCount
    );

    const requestedCount =
      Number.isFinite(requestedNumber)
        ? Math.min(
            20,
            Math.max(
              3,
              Math.round(requestedNumber)
            )
          )
        : 10;

    const [resumeEvidence, projectEvidence] =
      await Promise.all([
        payload.useResume
          ? buildResumeEvidence(req.user.id)
          : Promise.resolve(null),
        buildProjectEvidence(
          req.user.id,
          payload
        ),
      ]);

    const rawQuestions =
      await requestJson({
        messages: [
          {
            role: "system",
            content:
              `You are a professional interviewer creating a practice interview. Return ONLY valid JSON, with no markdown and no explanation. The JSON must have exactly one key: questions. questions must be an array with exactly ${requestedCount} objects. Each object must have exactly these keys: question (string), category (string), hint (string). Generate distinct, natural spoken interview questions aligned to the role, experience level, interview type, difficulty, duration, job description and evidence. Do not invent facts about the candidate. If evidence is limited, ask questions that let the candidate provide real examples. For Project Defence, focus on project decisions, contribution, trade-offs and outcomes. For HR, focus on behaviour, collaboration, motivation and communication. For Technical, focus on concepts, practical application and problem solving. Keep every question clear and under 320 characters; keep every hint under 260 characters and make it a short answer-focus prompt, not an answer.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole,
              experienceLevel: boundedText(
                payload.experienceLevel,
                80
              ),
              interviewType: boundedText(
                payload.interviewType,
                80
              ),
              difficulty: boundedText(
                payload.difficulty,
                80
              ),
              durationMinutes: boundedText(
                payload.duration,
                20
              ),
              questionCount: requestedCount,
              jobDescription: boundedText(
                payload.jobDescription,
                4000
              ),
              useResume: Boolean(
                payload.useResume
              ),
              useProjectEvidence: Boolean(
                payload.useProjectEvidence
              ),
              resumeEvidence:
                resumeEvidence
                  ? boundedText(
                      resumeEvidence,
                      6000
                    )
                  : null,
              projectEvidence:
                projectEvidence
                  ? boundedText(
                      projectEvidence,
                      4000
                    )
                  : null,
            }),
          },
        ],
        maxTokens: 3500,
        temperature: 0.5,
      });

    const questions =
      normalizeGeneratedQuestions(
        rawQuestions,
        requestedCount
      );

    res.status(200).json({
      message:
        "Interview questions generated successfully",
      questions,
      count: questions.length,
      sources: {
        resume: Boolean(resumeEvidence),
        project: Boolean(projectEvidence),
      },
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
      "AI INTERVIEW QUESTIONS ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const generateAdaptiveFollowup = async (
  req,
  res
) => {
  try {
    const payload = req.body || {};

    const setup =
      payload.setup &&
      typeof payload.setup === "object" &&
      !Array.isArray(payload.setup)
        ? payload.setup
        : {};

    const targetRole = boundedText(
      setup.targetRole || payload.targetRole,
      160
    );

    const question = boundedText(
      payload.question,
      500
    );

    const answer = boundedText(
      payload.answer,
      3000
    );

    if (
      !targetRole ||
      !question ||
      countWords(answer) < 3
    ) {
      return res.status(400).json({
        message:
          "setup.targetRole, question and a substantive answer are required",
      });
    }

    const askedQuestions = boundedArray(
      payload.askedQuestions,
      12,
      320
    );

    const [resumeEvidence, projectEvidence] =
      await Promise.all([
        setup.useResume
          ? buildResumeEvidence(req.user.id)
          : Promise.resolve(null),
        buildProjectEvidence(
          req.user.id,
          setup
        ),
      ]);

    const rawFollowup =
      await requestJson({
        messages: [
          {
            role: "system",
            content:
              "You are a professional interviewer conducting a live practice interview. Return ONLY valid JSON, with no markdown and no explanation. Use exactly these keys: question (string), category (string), hint (string). Generate ONE distinct adaptive follow-up that probes a specific gap, decision, metric, trade-off or example in the candidate's answer. Do not repeat any asked question. Do not invent facts. Do not ask for private information. Keep the question under 320 characters and the hint under 260 characters. If the answer is too vague to support a meaningful follow-up, ask for one concrete example.",
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole,
              experienceLevel: boundedText(
                setup.experienceLevel,
                80
              ),
              interviewType: boundedText(
                setup.interviewType,
                80
              ),
              difficulty: boundedText(
                setup.difficulty,
                80
              ),
              jobDescription: boundedText(
                setup.jobDescription,
                4000
              ),
              currentQuestion: question,
              currentCategory: boundedText(
                payload.category,
                80
              ) || "General",
              answer,
              askedQuestions,
              resumeEvidence:
                resumeEvidence
                  ? boundedText(
                      resumeEvidence,
                      6000
                    )
                  : null,
              projectEvidence:
                projectEvidence
                  ? boundedText(
                      projectEvidence,
                      4000
                    )
                  : null,
            }),
          },
        ],
        maxTokens: 800,
        temperature: 0.3,
      });

    const followupQuestion = boundedText(
      rawFollowup && rawFollowup.question,
      320
    );

    if (
      followupQuestion.length < 12 ||
      askedQuestions.some(
        (item) =>
          item.toLowerCase() ===
          followupQuestion.toLowerCase()
      )
    ) {
      return res.status(200).json({
        message:
          "No distinct adaptive follow-up was generated",
        question: null,
      });
    }

    res.status(200).json({
      message:
        "Adaptive follow-up generated successfully",
      question: {
        category:
          boundedText(
            rawFollowup && rawFollowup.category,
            80
          ) ||
          boundedText(payload.category, 80) ||
          "General",
        question: followupQuestion,
        hint: boundedText(
          rawFollowup && rawFollowup.hint,
          260
        ),
        adaptive: true,
      },
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
      "AI ADAPTIVE FOLLOWUP ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const transcribeInterviewAnswer = async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio recording is required",
      });
    }

    const text = await transcribeAudio({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    const transcript = boundedText(
      text,
      8000
    );

    res.status(200).json({
      message: "Audio transcribed successfully",
      text: transcript,
      hasSpeech:
        Boolean(transcript) &&
        countWords(transcript) >= 3,
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
      "INTERVIEW TRANSCRIBE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const countWords = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const averageScore = (values) =>
  values.length
    ? Math.round(
        values.reduce(
          (total, value) =>
            total + Number(value || 0),
          0
        ) / values.length
      )
    : 0;

const clampScore = (value, fallback = 0) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
};

const scoreStatus = (score, skipped) => {
  if (skipped) return "Skipped";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
};

const defaultQuestionFeedback = (answer) => {
  if (answer.skipped) {
    return "This question was skipped.";
  }

  if (answer.wordCount < 3) {
    return "No usable answer was provided. A recording without speech content cannot earn a score.";
  }

  return "No AI feedback was returned for this answer.";
};

const buildEmptyReport = (
  answers,
  summary
) => ({
  overall: 0,
  technical: 0,
  communication: 0,
  project: 0,
  completion: 0,
  summary,
  strengths: [],
  improvements: [
    "Provide a typed answer or speak a real response before submitting.",
  ],
  recommendations: [
    "Provide a typed answer or speak a real response before submitting.",
  ],
  questions: answers.map((answer) => ({
    questionId: answer.questionId,
    score: 0,
    status: scoreStatus(
      0,
      answer.skipped
    ),
    feedback: defaultQuestionFeedback(
      answer
    ),
    strengths: [],
    improvements: [],
  })),
  generatedAt: new Date().toISOString(),
});

const generateInterviewReport = async (
  req,
  res
) => {
  try {
    const payload =
      req.body || {};

    if (
      !payload.setup ||
      typeof payload.setup !==
        "object" ||
      !Array.isArray(payload.answers)
    ) {
      return res.status(400).json({
        message:
          "setup and answers are required",
      });
    }

    const setup = payload.setup;

    const targetRole = boundedText(
      setup.targetRole,
      160
    );

    if (!targetRole) {
      return res.status(400).json({
        message:
          "setup.targetRole is required",
      });
    }

    const answers =
      payload.answers.slice(0, 25).map(
        (answer, index) => {
          const text = boundedText(
            answer && answer.answer,
            3000
          );

          return {
            questionId:
              answer &&
              answer.questionId !==
                undefined
                ? answer.questionId
                : index + 1,
            question: boundedText(
              answer && answer.question,
              500
            ),
            category:
              boundedText(
                answer && answer.category,
                80
              ) || "General",
            answer: text,
            wordCount: countWords(text),
            skipped: Boolean(
              answer && answer.skipped
            ),
            hasAudio: Boolean(
              answer && answer.hasAudio
            ),
            recordingDuration:
              Number(
                answer &&
                  answer.recordingDuration
              ) || 0,
          };
        }
      );

    const substantiveAnswers =
      answers.filter(
        (answer) =>
          !answer.skipped &&
          answer.wordCount >= 3
      );

    if (!substantiveAnswers.length) {
      return res.status(200).json({
        message:
          "Interview report generated",
        report: buildEmptyReport(
          answers,
          "No substantive answers were provided. Recordings without speech content are scored as zero."
        ),
      });
    }

    const [resumeEvidence, projectEvidence] =
      await Promise.all([
        setup.useResume
          ? buildResumeEvidence(req.user.id)
          : Promise.resolve(null),
        buildProjectEvidence(
          req.user.id,
          setup
        ),
      ]);

    const rawReport =
      await requestJson({
        messages: [
          {
            role: "system",
            content:
              "You are a strict interview evaluator. Return ONLY valid JSON, with no markdown and no explanation. Use exactly these keys: overall (0-100 number), technical (0-100 number), communication (0-100 number), project (0-100 number), summary (string under 800 characters), strengths (array of up to 5 strings), improvements (array of up to 5 strings), recommendations (array of up to 5 concrete next-practice actions), questions (array with one object for every submitted answer, in the same order). Each question object must have exactly these keys: questionId, score (0-100 number), feedback (string under 500 characters), strengths (array of up to 3 strings), improvements (array of up to 3 strings). Score only the actual answer text. An empty answer, skipped answer, filler, or a recording with no transcript scores 0. Do not award points for hasAudio or recordingDuration. DO NOT give a baseline score of 50 or 59. Use the full 0-100 range: generic one-line answers 0-25, partial answers 26-55, correct answers with examples 56-79, strong specific answers 80-100. Judge relevance, correctness, depth, examples, structure and communication from the answer text. Do not invent or assume facts. If evidence is provided, use it to check whether claims are grounded.",
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole,
              experienceLevel: boundedText(
                setup.experienceLevel,
                80
              ),
              interviewType: boundedText(
                setup.interviewType,
                80
              ),
              difficulty: boundedText(
                setup.difficulty,
                80
              ),
              questionCount:
                answers.length,
              jobDescription: boundedText(
                setup.jobDescription,
                4000
              ),
              resumeEvidence:
                resumeEvidence
                  ? boundedText(
                      resumeEvidence,
                      6000
                    )
                  : null,
              projectEvidence:
                projectEvidence
                  ? boundedText(
                      projectEvidence,
                      4000
                    )
                  : null,
              answers,
            }),
          },
        ],
        maxTokens: 4000,
        temperature: 0.2,
      });

    const rawQuestions = Array.isArray(
      rawReport && rawReport.questions
    )
      ? rawReport.questions
      : [];

    const questions =
      answers.map((answer, index) => {
        const rawQuestion =
          rawQuestions.find(
            (item) =>
              String(
                item && item.questionId
              ) ===
              String(answer.questionId)
          ) ||
          rawQuestions[index] ||
          {};

        let score = clampScore(
          rawQuestion.score
        );

        if (
          answer.skipped ||
          answer.wordCount < 3
        ) {
          score = 0;
        }

        return {
          questionId: answer.questionId,
          score,
          skipped: Boolean(
            answer.skipped ||
              answer.wordCount < 3
          ),
          status: scoreStatus(
            score,
            answer.skipped
          ),
          feedback:
            boundedText(
              rawQuestion.feedback,
              600
            ) ||
            defaultQuestionFeedback(
              answer
            ),
          strengths: boundedArray(
            rawQuestion.strengths,
            4
          ),
          improvements: boundedArray(
            rawQuestion.improvements,
            4
          ),
        };
      });

    const scoredQuestions =
      questions.filter(
        (question) => !question.skipped
      );

    if (
      !scoredQuestions.length ||
      scoredQuestions.every(
        (question) =>
          question.score === 0
      )
    ) {
      return res.status(200).json({
        message:
          "Interview report generated",
        report: buildEmptyReport(
          answers,
          "The AI could not find substantive, relevant answer content to score. Recordings without speech content are scored as zero."
        ),
      });
    }

    const questionAverage =
      averageScore(
        scoredQuestions.map(
          (question) => question.score
        )
      );

    const overall = clampScore(
      rawReport && rawReport.overall,
      questionAverage
    );

    const categoryAverage = (names) => {
      const values = questions
        .filter((question) => {
          if (question.skipped) {
            return false;
          }

          const answer = answers.find(
            (item) =>
              String(item.questionId) ===
              String(question.questionId)
          );

          return (
            answer &&
            names.includes(answer.category)
          );
        })
        .map((question) => question.score);

      return values.length
        ? averageScore(values)
        : 0;
    };

    const completion =
      answers.length
        ? Math.round(
            (substantiveAnswers.length /
              answers.length) *
              100
          )
        : 0;

    const improvements = boundedArray(
      rawReport && rawReport.improvements,
      6
    );

    const recommendations = boundedArray(
      rawReport && rawReport.recommendations,
      6
    );

    const report = {
      overall,
      technical: categoryAverage([
        "Technical",
        "Problem Solving",
      ]),
      communication: clampScore(
        rawReport &&
          rawReport.communication,
        overall
      ),
      project: categoryAverage([
        "Project Defence",
      ]),
      completion,
      summary:
        boundedText(
          rawReport && rawReport.summary,
          1000
        ) ||
        "AI evaluation completed for the answers with substantive content.",
      strengths: boundedArray(
        rawReport && rawReport.strengths,
        6
      ),
      improvements,
      recommendations:
        recommendations.length
          ? recommendations
          : improvements,
      questions,
      generatedAt:
        new Date().toISOString(),
    };

    res.status(200).json({
      message:
        "Interview report generated successfully",
      report,
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
      "AI INTERVIEW REPORT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  transcribeInterviewAnswer,
  generateInterviewReport,
  generateInterviewQuestions,
  generateAdaptiveFollowup,
  createInterview,
  getInterviews,
  getInterviewById,
  deleteInterview,
  deleteAllInterviews,
  scoreInterview,
};
