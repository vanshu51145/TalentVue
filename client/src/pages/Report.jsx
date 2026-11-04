import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../utils/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function Report({ user, setActivePage }) {
  const [interview, setInterview] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const completedKey =
    `talentVueCompletedInterview_${user?.id}`;

  const historyKey =
    `talentVueInterviewHistory_${user?.id}`;

  // Load completed interview
  useEffect(() => {
    if (!user?.id) return;

    const savedInterview =
      localStorage.getItem(completedKey);

    if (!savedInterview) {
      // Fallback: no local latest -> load latest session from backend
      const loadFromServer = async () => {
        let response;

        try {
          response = await apiFetch(
            "/api/interviews"
          );
        } catch (error) {
          console.error(
            "REPORT FALLBACK ERROR:",
            error
          );

          setError(
            "No completed interview was found. Complete an interview to generate your report."
          );

          return;
        }

        const interviews =
          response.ok &&
          Array.isArray(
            response.data.interviews
          )
            ? response.data.interviews
            : [];

        if (!interviews.length) {
          setError(
            "No completed interview was found. Complete an interview to generate your report."
          );

          return;
        }

        const latest =
          interviews[0];

        setInterview(latest);

        const oldHistory =
          JSON.parse(
            localStorage.getItem(
              historyKey
            )
          ) || [];

        const exists =
          oldHistory.some(
            (item) =>
              String(
                item.sessionId
              ) ===
              String(
                latest.sessionId
              )
          );

        let updatedHistory =
          oldHistory;

        if (!exists) {
          updatedHistory = [
            ...oldHistory,
            latest,
          ];

          localStorage.setItem(
            historyKey,
            JSON.stringify(
              updatedHistory
            )
          );
        }

        setHistory(updatedHistory);
      };

      loadFromServer();

      return;
    }

    try {
      const parsedInterview =
        JSON.parse(savedInterview);

      setInterview(parsedInterview);

      const oldHistory =
        JSON.parse(
          localStorage.getItem(historyKey)
        ) || [];

      const exists = oldHistory.some(
        (item) =>
          String(item.sessionId) ===
          String(parsedInterview.sessionId)
      );

      let updatedHistory = oldHistory;

      if (!exists) {
        updatedHistory = [
          ...oldHistory,
          parsedInterview,
        ];

        localStorage.setItem(
          historyKey,
          JSON.stringify(updatedHistory)
        );
      }

      setHistory(updatedHistory);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load your interview report."
      );
    }
  }, [user?.id]);

  /*
    FRONTEND DEMO SCORING

    Later:
    AI API response will replace this logic.
  */
  const questionResults = useMemo(() => {
    if (!interview?.answers) return [];

    return interview.answers.map(
      (answer, index) => {
        if (answer.skipped) {
          return {
            ...answer,
            number: index + 1,
            score: 0,
            status: "Skipped",
          };
        }

        const wordCount =
          answer.answer
            ?.trim()
            .split(/\s+/)
            .filter(Boolean).length || 0;

        let score = 50;

        /*
          Text completeness
        */
        score += Math.min(
          wordCount * 0.7,
          25
        );

        /*
          Voice practice
        */
        if (answer.hasAudio) {
          score += 7;
        }

        /*
          Speaking duration
        */
        score += Math.min(
          Number(
            answer.recordingDuration || 0
          ) * 0.25,
          13
        );

        score = Math.round(
          Math.min(score, 95)
        );

        let status = "Needs Improvement";

        if (score >= 80) {
          status = "Strong";
        } else if (score >= 65) {
          status = "Good";
        }

        return {
          ...answer,
          number: index + 1,
          score,
          status,
          wordCount,
        };
      }
    );
  }, [interview]);

  const reportScores = useMemo(() => {
    if (!questionResults.length) {
      return {
        overall: 0,
        technical: 0,
        communication: 0,
        project: 0,
        completion: 0,
      };
    }

    const answered =
      questionResults.filter(
        (item) => !item.skipped
      );

    const completion = Math.round(
      (answered.length /
        questionResults.length) *
        100
    );

    const overall =
      average(
        questionResults.map(
          (item) => item.score
        )
      );

    const technicalQuestions =
      questionResults.filter(
        (item) =>
          [
            "Technical",
            "Problem Solving",
          ].includes(item.category)
      );

    const projectQuestions =
      questionResults.filter(
        (item) =>
          item.category ===
          "Project Defence"
      );

    const communicationQuestions =
      questionResults.filter(
        (item) =>
          [
            "Introduction",
            "HR",
            "Behavioural",
            "Closing",
          ].includes(item.category)
      );

    const technical =
      technicalQuestions.length
        ? average(
            technicalQuestions.map(
              (item) => item.score
            )
          )
        : overall;

    const project =
      projectQuestions.length
        ? average(
            projectQuestions.map(
              (item) => item.score
            )
          )
        : overall;

    /*
      Frontend delivery estimate.
      Not real speech-analysis yet.
    */
    const voiceAnswers =
      answered.filter(
        (item) => item.hasAudio
      );

    let communication;

    if (voiceAnswers.length) {
      const averageDuration =
        average(
          voiceAnswers.map(
            (item) =>
              item.recordingDuration || 0
          )
        );

      communication = Math.min(
        95,
        Math.round(
          completion * 0.55 +
            Math.min(
              averageDuration,
              60
            ) *
              0.45
        )
      );
    } else if (
      communicationQuestions.length
    ) {
      communication =
        average(
          communicationQuestions.map(
            (item) => item.score
          )
        );
    } else {
      communication = overall;
    }

    return {
      overall,
      technical,
      communication,
      project,
      completion,
    };
  }, [questionResults]);

  const categoryData = useMemo(() => {
    const categories = [
      "Introduction",
      "Technical",
      "Problem Solving",
      "Project Defence",
      "HR",
      "Behavioural",
      "Closing",
    ];

    return categories
      .map((category) => {
        const results =
          questionResults.filter(
            (item) =>
              item.category === category
          );

        if (!results.length) {
          return null;
        }

        return {
          category,
          score: average(
            results.map(
              (item) => item.score
            )
          ),
        };
      })
      .filter(Boolean);
  }, [questionResults]);

  const questionChartData =
    questionResults.map((item) => ({
      question: `Q${item.number}`,
      score: item.score,
    }));

  /*
    Build performance trend from interview history.
  */
  const historyChartData = useMemo(() => {
    return history.map(
      (historyInterview, index) => {
        const results =
          historyInterview.answers?.map(
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

              let score =
                50 +
                Math.min(
                  words * 0.7,
                  25
                );

              if (answer.hasAudio) {
                score += 7;
              }

              score += Math.min(
                Number(
                  answer.recordingDuration ||
                    0
                ) * 0.25,
                13
              );

              return Math.round(
                Math.min(score, 95)
              );
            }
          ) || [];

        return {
          attempt: `Interview ${index + 1}`,
          score: results.length
            ? average(results)
            : 0,
        };
      }
    );
  }, [history]);

  const insights = useMemo(() => {
    return createInsights(
      reportScores,
      questionResults
    );
  }, [
    reportScores,
    questionResults,
  ]);

  const handleRetake = () => {
    setActivePage("Start Interview");
  };

  if (error) {
    return (
      <EmptyReport
        message={error}
        setActivePage={setActivePage}
      />
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>

          <p className="mt-4 text-sm text-slate-500">
            Preparing your report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Interview Intelligence
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Interview Performance Report
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {interview.setup?.targetRole} •{" "}
            {interview.setup?.interviewType} •{" "}
            {interview.setup?.difficulty}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() =>
              setActivePage("Overview")
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Dashboard
          </button>

          <button
            onClick={handleRetake}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Retake Interview
          </button>
        </div>
      </section>

      {/* DEMO WARNING */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
        <strong>
          Frontend demo scoring:
        </strong>{" "}
        These scores currently use answer completion,
        written-answer length and voice-recording
        information. AI-based correctness, speech
        clarity and communication analysis will replace
        this logic when the backend is connected.
      </div>

      {/* OVERALL SCORE */}
      <section className="mt-6 overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">

          {/* Main Score */}
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
              Overall Performance
            </p>

            <div className="mt-5 flex justify-center lg:justify-start">
              <ScoreCircle
                score={reportScores.overall}
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              {getPerformanceLabel(
                reportScores.overall
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {getPerformanceMessage(
                reportScores.overall
              )}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DarkScore
              label="Technical"
              value={reportScores.technical}
            />

            <DarkScore
              label="Delivery"
              value={
                reportScores.communication
              }
            />

            <DarkScore
              label="Project"
              value={reportScores.project}
            />

            <DarkScore
              label="Completion"
              value={reportScores.completion}
            />
          </div>
        </div>
      </section>

      {/* SUMMARY STATS */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStat
          label="Questions"
          value={
            interview.totalQuestions ||
            questionResults.length
          }
          description="Total interview questions"
        />

        <ReportStat
          label="Answered"
          value={
            questionResults.filter(
              (item) => !item.skipped
            ).length
          }
          description="Questions attempted"
        />

        <ReportStat
          label="Skipped"
          value={
            questionResults.filter(
              (item) => item.skipped
            ).length
          }
          description="Questions skipped"
        />

        <ReportStat
          label="Attempts"
          value={history.length}
          description="Total completed interviews"
        />
      </section>

      {/* QUESTION CHART + CATEGORY */}
      <section className="mt-6 grid gap-6 xl:grid-cols-2">

        {/* Question Performance */}
        <ChartCard
          title="Question Performance"
          description="Score across individual interview questions."
        >
          <div className="h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={questionChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="question"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="score"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category Performance */}
        <ChartCard
          title="Category Performance"
          description="Performance across interview areas."
        >
          <div className="h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 15,
                  left: 25,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="category"
                  width={110}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="score"
                  fill="#6366f1"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* HISTORY TREND */}
      <section className="mt-6">
        <ChartCard
          title="Interview Progress"
          description="See how your overall interview performance changes across practice sessions."
        >
          {historyChartData.length > 1 ? (
            <div className="h-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={historyChartData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="attempt"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl bg-slate-50 p-6 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-600">
                  ↑
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  Complete another interview
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Your progress trend will appear after
                  multiple interview attempts.
                </p>
              </div>
            </div>
          )}
        </ChartCard>
      </section>

      {/* INSIGHTS */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">

        <InsightCard
          title="Strengths"
          type="success"
          items={insights.strengths}
        />

        <InsightCard
          title="Areas to Improve"
          type="warning"
          items={insights.improvements}
        />

        <InsightCard
          title="Next Practice"
          type="info"
          items={insights.recommendations}
        />
      </section>

      {/* PERFORMANCE BREAKDOWN */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Score Breakdown
          </p>

          <h2 className="mt-2 text-lg font-bold text-slate-900">
            Interview Readiness
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <PerformanceBar
            title="Technical Knowledge"
            value={reportScores.technical}
          />

          <PerformanceBar
            title="Communication & Delivery"
            value={
              reportScores.communication
            }
          />

          <PerformanceBar
            title="Project Defence"
            value={reportScores.project}
          />

          <PerformanceBar
            title="Question Completion"
            value={
              reportScores.completion
            }
          />
        </div>
      </section>

      {/* ANSWER REVIEW */}
      <section className="mt-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Detailed Review
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Question-by-Question Analysis
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review your answers and identify questions
            that need more practice.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {questionResults.map(
            (result) => (
              <AnswerReview
                key={result.number}
                result={result}
              />
            )
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-8 rounded-3xl bg-indigo-600 p-6 text-center sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
          Keep Improving
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          One interview is just the beginning.
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-indigo-100">
          Focus on your weaker areas and retake the
          interview to compare your performance.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={handleRetake}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600"
          >
            Practice Again
          </button>

          <button
            onClick={() =>
              setActivePage("Overview")
            }
            className="rounded-xl border border-indigo-400 px-6 py-3 font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}



function average(numbers) {
  if (!numbers.length) return 0;

  return Math.round(
    numbers.reduce(
      (total, number) =>
        total + Number(number || 0),
      0
    ) / numbers.length
  );
}



function createInsights(
  scores,
  questions
) {
  const strengths = [];
  const improvements = [];
  const recommendations = [];

  if (scores.technical >= 75) {
    strengths.push(
      "Good consistency in technical questions."
    );
  } else {
    improvements.push(
      "Technical answers need more depth and examples."
    );

    recommendations.push(
      "Practise explaining technical concepts using real project examples."
    );
  }

  if (scores.project >= 75) {
    strengths.push(
      "You demonstrated good project-defence preparation."
    );
  } else {
    improvements.push(
      "Project contribution and technical decisions need clearer explanation."
    );

    recommendations.push(
      "Review your project's architecture, challenges and personal contribution."
    );
  }

  if (
    scores.communication >= 70
  ) {
    strengths.push(
      "Good participation and answer delivery."
    );
  } else {
    improvements.push(
      "Communication and answer delivery can be improved."
    );

    recommendations.push(
      "Practise 60–90 second structured voice answers."
    );
  }

  if (scores.completion >= 90) {
    strengths.push(
      "You attempted almost all interview questions."
    );
  }

  const skipped =
    questions.filter(
      (question) => question.skipped
    );

  if (skipped.length) {
    improvements.push(
      `${skipped.length} question${
        skipped.length > 1 ? "s were" : " was"
      } skipped.`
    );

    recommendations.push(
      "Review skipped questions and attempt them during your next practice session."
    );
  }

  if (!strengths.length) {
    strengths.push(
      "You completed the interview and created a baseline for improvement."
    );
  }

  if (!improvements.length) {
    improvements.push(
      "Continue adding more detailed examples to make strong answers even better."
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      "Increase the interview difficulty for your next practice session."
    );
  }

  return {
    strengths,
    improvements,
    recommendations,
  };
}



function getPerformanceLabel(score) {
  if (score >= 85) {
    return "Excellent Performance";
  }

  if (score >= 75) {
    return "Strong Performance";
  }

  if (score >= 60) {
    return "Good Start";
  }

  return "More Practice Needed";
}



function getPerformanceMessage(score) {
  if (score >= 85) {
    return "You showed strong interview preparation. Continue practising difficult follow-up questions.";
  }

  if (score >= 75) {
    return "You are building good interview readiness. Focus on weaker areas to improve consistency.";
  }

  if (score >= 60) {
    return "You have a useful foundation. More structured answers and deeper project explanations will help.";
  }

  return "Use this report as your baseline and practise your weak topics before the next attempt.";
}



function ScoreCircle({ score }) {
  return (
    <div className="flex h-40 w-40 items-center justify-center rounded-full bg-indigo-500/10 ring-8 ring-indigo-500/20">
      <div className="text-center">
        <p className="text-4xl font-bold text-white">
          {score}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          out of 100
        </p>
      </div>
    </div>
  );
}



function DarkScore({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}%
      </p>
    </div>
  );
}



function ReportStat({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}



function ChartCard({
  title,
  description,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}



function InsightCard({
  title,
  items,
  type,
}) {
  const styles = {
    success: {
      container:
        "border-emerald-100 bg-emerald-50",
      heading: "text-emerald-800",
      icon:
        "bg-emerald-100 text-emerald-600",
      text: "text-emerald-700",
      symbol: "✓",
    },

    warning: {
      container:
        "border-amber-100 bg-amber-50",
      heading: "text-amber-800",
      icon:
        "bg-amber-100 text-amber-600",
      text: "text-amber-700",
      symbol: "!",
    },

    info: {
      container:
        "border-indigo-100 bg-indigo-50",
      heading: "text-indigo-900",
      icon:
        "bg-indigo-100 text-indigo-600",
      text: "text-indigo-700",
      symbol: "→",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`rounded-2xl border p-5 ${style.container}`}
    >
      <h2
        className={`font-bold ${style.heading}`}
      >
        {title}
      </h2>

      <div className="mt-5 space-y-4">
        {items.map(
          (item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex gap-3"
            >
              <div
                className={`flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold ${style.icon}`}
              >
                {style.symbol}
              </div>

              <p
                className={`text-sm leading-6 ${style.text}`}
              >
                {item}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}



function PerformanceBar({
  title,
  value,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          {title}
        </p>

        <p className="text-sm font-bold text-slate-700">
          {value}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{
            width: `${value}%`,
          }}
        ></div>
      </div>
    </div>
  );
}



function AnswerReview({
  result,
}) {
  const [open, setOpen] =
    useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl text-sm font-bold ${
              result.skipped
                ? "bg-red-50 text-red-500"
                : result.score >= 80
                ? "bg-emerald-50 text-emerald-600"
                : result.score >= 65
                ? "bg-indigo-50 text-indigo-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {result.number}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {result.category}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  result.skipped
                    ? "bg-red-50 text-red-500"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {result.status}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-800">
              {result.question}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div className="text-right">
            <p className="text-xs text-slate-400">
              Score
            </p>

            <p
              className={`font-bold ${
                result.skipped
                  ? "text-red-500"
                  : "text-indigo-600"
              }`}
            >
              {result.score}/100
            </p>
          </div>

          <span className="text-xl text-slate-400">
            {open ? "−" : "+"}
          </span>
        </div>
      </button>

      {/* Details */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">

          {result.skipped ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-600">
                This question was skipped.
              </p>

              <p className="mt-2 text-xs leading-5 text-red-500">
                Review this question before your
                next interview attempt.
              </p>
            </div>
          ) : (
            <>
              {/* Text */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Written Answer
                </p>

                <div className="mt-3 rounded-xl bg-white p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {result.answer ||
                      "No written answer. Voice response was used."}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ReviewStat
                  label="Voice"
                  value={
                    result.hasAudio
                      ? "Recorded"
                      : "No"
                  }
                />

                <ReviewStat
                  label="Duration"
                  value={
                    result.hasAudio
                      ? formatDuration(
                          result.recordingDuration
                        )
                      : "—"
                  }
                />

                <ReviewStat
                  label="Words"
                  value={
                    result.wordCount || 0
                  }
                />
              </div>

              {/* Feedback */}
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Practice Feedback
                </p>

                <p className="mt-2 text-sm leading-6 text-indigo-900">
                  {getQuestionFeedback(
                    result
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}



function ReviewStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}



function getQuestionFeedback(
  result
) {
  if (result.score >= 85) {
    return "Strong attempt. During AI evaluation, we will additionally check technical correctness, examples, relevance and communication quality.";
  }

  if (result.score >= 70) {
    return "Good attempt. Try adding a clearer example, result or technical reason to strengthen your response.";
  }

  return "Your answer needs more depth. Use a simple structure: direct answer → explanation → example → result or limitation.";
}



function formatDuration(seconds) {
  const value =
    Number(seconds || 0);

  if (value < 60) {
    return `${value}s`;
  }

  const minutes =
    Math.floor(value / 60);

  const remaining =
    value % 60;

  return `${minutes}m ${remaining}s`;
}



function EmptyReport({
  message,
  setActivePage,
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600">
          R
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          Report Not Available
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <button
          onClick={() =>
            setActivePage(
              "Start Interview"
            )
          }
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}

export default Report;