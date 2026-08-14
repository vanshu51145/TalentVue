function safeParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getStorageKeys(userId) {
  return {
    resume: `talentVueResume_${userId}`,
    projects: `talentVueProjects_${userId}`,
    setup: `talentVueInterviewSetup_${userId}`,
    pendingInterview: `talentVuePendingInterview_${userId}`,
    activeInterview: `talentVueActiveInterview_${userId}`,
    completedInterview: `talentVueCompletedInterview_${userId}`,
    history: `talentVueInterviewHistory_${userId}`,
  };
}

// ------------------------
// RESUME
// ------------------------

export function getResume(userId) {
  if (!userId) return null;

  const keys = getStorageKeys(userId);

  return safeParse(
    localStorage.getItem(keys.resume),
    null
  );
}

export function saveResume(userId, resume) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.setItem(
    keys.resume,
    JSON.stringify(resume)
  );
}

export function deleteResume(userId) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.removeItem(keys.resume);
}

// ------------------------
// PROJECTS
// ------------------------

export function getProjects(userId) {
  if (!userId) return [];

  const keys = getStorageKeys(userId);

  const projects = safeParse(
    localStorage.getItem(keys.projects),
    []
  );

  return Array.isArray(projects)
    ? projects
    : [];
}

export function saveProjects(userId, projects) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.setItem(
    keys.projects,
    JSON.stringify(projects)
  );
}

// ------------------------
// INTERVIEW HISTORY
// ------------------------

export function getInterviewHistory(userId) {
  if (!userId) return [];

  const keys = getStorageKeys(userId);

  const history = safeParse(
    localStorage.getItem(keys.history),
    []
  );

  return Array.isArray(history)
    ? history
    : [];
}

export function saveInterviewHistory(
  userId,
  history
) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.setItem(
    keys.history,
    JSON.stringify(history)
  );
}

export function addInterviewToHistory(
  userId,
  interview
) {
  const history =
    getInterviewHistory(userId);

  const alreadyExists =
    history.some(
      (item) =>
        String(item.sessionId) ===
        String(interview.sessionId)
    );

  if (alreadyExists) {
    return history;
  }

  const updatedHistory = [
    ...history,
    interview,
  ];

  saveInterviewHistory(
    userId,
    updatedHistory
  );

  return updatedHistory;
}

export function deleteInterviewFromHistory(
  userId,
  sessionId
) {
  const history =
    getInterviewHistory(userId);

  const updatedHistory =
    history.filter(
      (item) =>
        String(item.sessionId) !==
        String(sessionId)
    );

  saveInterviewHistory(
    userId,
    updatedHistory
  );

  return updatedHistory;
}

export function clearInterviewHistory(
  userId
) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.removeItem(
    keys.history
  );

  localStorage.removeItem(
    keys.completedInterview
  );
}

// ------------------------
// LATEST REPORT
// ------------------------

export function setLatestCompletedInterview(
  userId,
  interview
) {
  if (!userId) return;

  const keys = getStorageKeys(userId);

  localStorage.setItem(
    keys.completedInterview,
    JSON.stringify(interview)
  );
}

export function getLatestCompletedInterview(
  userId
) {
  if (!userId) return null;

  const keys = getStorageKeys(userId);

  return safeParse(
    localStorage.getItem(
      keys.completedInterview
    ),
    null
  );
}

// ------------------------
// FRONTEND MOCK SCORE
// ------------------------

export function calculateInterviewScore(
  interview
) {
  if (
    !interview ||
    !Array.isArray(interview.answers) ||
    interview.answers.length === 0
  ) {
    return 0;
  }

  const scores =
    interview.answers.map(
      (answer) => {
        if (answer.skipped) {
          return 0;
        }

        const words =
          answer.answer
            ?.trim()
            .split(/\s+/)
            .filter(Boolean)
            .length || 0;

        let score = 50;

        score += Math.min(
          words * 0.7,
          25
        );

        if (answer.hasAudio) {
          score += 7;
        }

        score += Math.min(
          Number(
            answer.recordingDuration || 0
          ) * 0.25,
          13
        );

        return Math.round(
          Math.min(score, 95)
        );
      }
    );

  const total =
    scores.reduce(
      (sum, score) =>
        sum + score,
      0
    );

  return Math.round(
    total / scores.length
  );
}

// ------------------------
// PRACTICE STREAK
// ------------------------

export function calculatePracticeStreak(
  history
) {
  if (!history.length) {
    return 0;
  }

  const uniqueDates = [
    ...new Set(
      history
        .map((item) => {
          if (!item.completedAt) {
            return null;
          }

          const date =
            new Date(
              item.completedAt
            );

          return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          ).getTime();
        })
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  if (!uniqueDates.length) {
    return 0;
  }

  let streak = 1;

  for (
    let index = 1;
    index < uniqueDates.length;
    index++
  ) {
    const difference =
      (uniqueDates[index - 1] -
        uniqueDates[index]) /
      (1000 * 60 * 60 * 24);

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ------------------------
// DASHBOARD STATS
// ------------------------

export function getDashboardStats(
  userId
) {
  const resume = getResume(userId);

  const projects =
    getProjects(userId);

  const history =
    getInterviewHistory(userId);

  const scores =
    history.map(
      calculateInterviewScore
    );

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / scores.length
        )
      : 0;

  let readiness = 25;

  if (resume) {
    readiness += 25;
  }

  if (projects.length > 0) {
    readiness += 25;
  }

  if (history.length > 0) {
    readiness += 25;
  }

  return {
    interviewCount:
      history.length,

    projectCount:
      projects.length,

    averageScore,

    practiceStreak:
      calculatePracticeStreak(
        history
      ),

    profileReadiness:
      readiness,

    resumeUploaded:
      Boolean(resume),

    resumeAnalyzed:
      resume?.status ===
      "analyzed",

    firstInterviewDone:
      history.length > 0,
  };
}

// ------------------------
// DATE FORMAT
// ------------------------

export function formatInterviewDate(
  value
) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ------------------------
// DEMO / MOCK DATA
// ------------------------

export function seedDemoData(user) {
  if (!user?.id) return;

  const keys =
    getStorageKeys(user.id);

  // Demo Resume
  if (
    !localStorage.getItem(
      keys.resume
    )
  ) {
    const demoResume = {
      fileName:
        "demo-resume.pdf",

      fileSize: 245000,

      uploadedAt:
        new Date().toISOString(),

      analyzedAt:
        new Date().toISOString(),

      status: "analyzed",

      analysis: {
        score: 84,

        profileType:
          "Full Stack Developer",

        skills: [
          "HTML",
          "CSS",
          "JavaScript",
          "React",
          "Node.js",
          "MongoDB",
        ],

        projects: [
          "Smart Utility Dashboard",
          "Portfolio Website",
        ],

        strengths: [
          "Good frontend skills",
          "Relevant project work",
          "Modern web technologies",
        ],

        improvements: [
          "Add measurable impact",
          "Mention deployment links",
        ],
      },
    };

    localStorage.setItem(
      keys.resume,
      JSON.stringify(demoResume)
    );
  }

  // Demo Project
  if (
    !localStorage.getItem(
      keys.projects
    )
  ) {
    const demoProjects = [
      {
        id: Date.now(),

        title:
          "Smart Utility Dashboard",

        description:
          "A responsive web application containing multiple utility tools including calculators, theme management and browser storage functionality.",

        projectType:
          "Academic",

        role:
          "Frontend Developer",

        technologies: [
          "HTML",
          "CSS",
          "JavaScript",
          "Bootstrap",
          "Local Storage",
        ],

        githubUrl:
          "https://github.com/",

        liveUrl: "",

        contribution:
          "Developed the user interface, utility modules, calculations and Local Storage integration.",

        challenges:
          "Maintaining application state and data between multiple pages.",

        outcome:
          "Successfully developed a responsive multi-page utility application.",

        evidenceFiles: [],

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      },
    ];

    localStorage.setItem(
      keys.projects,
      JSON.stringify(
        demoProjects
      )
    );
  }

  // Demo Interviews
  const oldHistory =
    getInterviewHistory(
      user.id
    );

  if (oldHistory.length === 0) {
    const now = Date.now();

    const scores = [
      {
        daysAgo: 4,
        words: 12,
      },
      {
        daysAgo: 2,
        words: 25,
      },
      {
        daysAgo: 0,
        words: 40,
      },
    ];

    const demoHistory =
      scores.map(
        (
          demo,
          index
        ) => {
          const completedAt =
            new Date(
              now -
                demo.daysAgo *
                  24 *
                  60 *
                  60 *
                  1000
            ).toISOString();

          return {
            sessionId:
              now + index,

            setup: {
              targetRole:
                "Full Stack Developer",

              interviewType:
                index === 0
                  ? "Technical"
                  : index === 1
                  ? "Project Defence"
                  : "Mixed",

              difficulty:
                index === 2
                  ? "Hard"
                  : "Medium",

              experienceLevel:
                "Fresher",

              questionCount:
                "5",

              duration:
                "20",

              selectedProjectTitle:
                "Smart Utility Dashboard",
            },

            answers: Array.from(
              { length: 5 }
            ).map(
              (
                _,
                answerIndex
              ) => ({
                questionId:
                  answerIndex + 1,

                question:
                  `Demo interview question ${
                    answerIndex + 1
                  }`,

                category:
                  answerIndex === 0
                    ? "Introduction"
                    : answerIndex === 1
                    ? "Technical"
                    : answerIndex === 2
                    ? "Project Defence"
                    : answerIndex === 3
                    ? "HR"
                    : "Closing",

                answer: Array(
                  demo.words
                )
                  .fill(
                    "answer"
                  )
                  .join(" "),

                hasAudio:
                  index > 0,

                recordingDuration:
                  index > 0
                    ? 45 +
                      answerIndex *
                        3
                    : 0,

                skipped:
                  false,

                answeredAt:
                  completedAt,
              })
            ),

            totalQuestions: 5,

            answeredQuestions: 5,

            skippedQuestions: 0,

            completedAt,

            status:
              "completed",
          };
        }
      );

    saveInterviewHistory(
      user.id,
      demoHistory
    );

    setLatestCompletedInterview(
      user.id,
      demoHistory[
        demoHistory.length - 1
      ]
    );
  }
}