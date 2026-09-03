import {
  useMemo,
  useState,
} from "react";
import Chatbot from "./Chatbot";

import {
  calculateInterviewScore,
  formatInterviewDate,
  getDashboardStats,
  getInterviewHistory,
  getProjects,
  getResume,
  seedDemoData,
  setLatestCompletedInterview,
} from "../../utils/storage";

function DashboardOverview({
  user,
  setActivePage,
}) {
  const [refresh, setRefresh] =
    useState(0);

  const data = useMemo(() => {
    const stats =
      getDashboardStats(
        user.id
      );

    const history =
      getInterviewHistory(
        user.id
      );

    const resume =
      getResume(user.id);

    const projects =
      getProjects(user.id);

    return {
      stats,
      history,
      resume,
      projects,
    };
  }, [user.id, refresh]);

  const {
    stats,
    history,
    resume,
    projects,
  } = data;

  const recentInterviews = [
    ...history,
  ]
    .reverse()
    .slice(0, 3);

  const firstName =
    user.name
      ?.split(" ")[0] ||
    "User";

  const handleDemoData = () => {
    seedDemoData(user);

    setRefresh(
      (previous) =>
        previous + 1
    );
  };

  const openReport = (
    interview
  ) => {
    setLatestCompletedInterview(
      user.id,
      interview
    );

    setActivePage(
      "Interview Result"
    );
  };

  return (
    <div>
      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Good to see you,{" "}
            {firstName}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track your interview
            preparation and continue
            improving.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          {history.length === 0 &&
            projects.length ===
              0 &&
            !resume && (
              <button
                onClick={
                  handleDemoData
                }
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
              >
                Load Demo Data
              </button>
            )}

          <button
            onClick={() =>
              setActivePage(
                "Start Interview"
              )
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Start Interview
          </button>

        </div>
      </section>
      {/* DEMO INTERVIEW VIDEO */}
<section className="mt-8">
  <div className="mb-4">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
      Welcome to TalentVue AI
    </p>

    <h2 className="mt-2 text-2xl font-bold text-slate-900">
      See How TalentVue AI Works
    </h2>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      Watch this short demo to understand how an AI-powered interview
      session works before starting your first interview.
    </p>
  </div>

  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="aspect-video w-full bg-slate-950">
      <video
        className="h-full w-full object-cover"
        controls
        playsInline
        preload="metadata"
        poster="/videos/interview-demo-poster.jpg"
      >
        <source
          src="/videos/interview-demo-1.mp4"
          type="video/mp4"
        />

        Your browser does not support the video tag.
      </video>
    </div>

    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h3 className="font-bold text-slate-900">
          Interview Demo
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Learn how to answer questions and interact with the AI interviewer.
        </p>
      </div>

      <button
        onClick={() => setActivePage("Start Interview")}
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Start Interview →
      </button>
    </div>
  </div>
</section>

      {/* STATS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Interviews"
          value={
            stats.interviewCount
          }
          description="Completed practice sessions"
          symbol="I"
        />

        <StatCard
          title="Average Score"
          value={
            stats.interviewCount
              ? `${stats.averageScore}%`
              : "--"
          }
          description="Across all attempts"
          symbol="%"
        />

        <StatCard
          title="Projects Added"
          value={
            stats.projectCount
          }
          description="Project evidence profiles"
          symbol="P"
        />

        <StatCard
          title="Practice Streak"
          value={`${stats.practiceStreak}`}
          description="Consecutive practice days"
          symbol="D"
        />

      </section>

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">

        {/* RECENT INTERVIEWS */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">

            <div>
              <h2 className="font-bold text-slate-900">
                Recent Interviews
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Your latest practice
                attempts
              </p>
            </div>

            {history.length >
              0 && (
              <button
                onClick={() =>
                  setActivePage(
                    "Interviews"
                  )
                }
                className="text-sm font-semibold text-indigo-600"
              >
                View All →
              </button>
            )}

          </div>

          {recentInterviews.length ===
          0 ? (
            <div className="flex min-h-[260px] items-center justify-center p-6 text-center">

              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600">
                  I
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No interviews yet
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Start your first
                  interview or load demo
                  data.
                </p>

              </div>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {recentInterviews.map(
                (
                  interview
                ) => (
                  <div
                    key={
                      interview.sessionId
                    }
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                        {
                          interview
                            .setup
                            ?.interviewType
                            ?.charAt(
                              0
                            ) ||
                          "I"
                        }
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {interview
                            .setup
                            ?.targetRole ||
                            "Interview"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            interview
                              .setup
                              ?.interviewType
                          }
                          {" • "}
                          {
                            interview
                              .setup
                              ?.difficulty
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatInterviewDate(
                            interview.completedAt
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Score
                        </p>

                        <p className="text-lg font-bold text-indigo-600">
                          {calculateInterviewScore(
                            interview
                          )}
                          %
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          openReport(
                            interview
                          )
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                      >
                        Report
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* PROFILE READINESS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <h2 className="font-bold text-slate-900">
            Profile Readiness
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Complete your preparation
            profile
          </p>

          <div className="mt-7 flex justify-center">

            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-50">

              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">

                <span className="text-2xl font-bold text-indigo-600">
                  {
                    stats.profileReadiness
                  }
                  %
                </span>

                <span className="text-[10px] text-slate-400">
                  Complete
                </span>

              </div>

            </div>

          </div>

          <div className="mt-7 space-y-3">

            <ReadinessItem
              completed
              title="Account Created"
            />

            <ReadinessItem
              completed={
                stats.resumeUploaded
              }
              title="Resume Uploaded"
            />

            <ReadinessItem
              completed={
                stats.projectCount >
                0
              }
              title="Project Added"
            />

            <ReadinessItem
              completed={
                stats.firstInterviewDone
              }
              title="First Interview"
            />

          </div>

        </div>

      </section>

      {/* QUICK ACTIONS */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <h2 className="font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Continue building your
          TalentVue profile.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <QuickAction
            code="CV"
            title="Resume"
            description={
              resume
                ? "Resume uploaded"
                : "Upload your resume"
            }
            onClick={() =>
              setActivePage(
                "Resume"
              )
            }
          />

          <QuickAction
            code="P"
            title="Projects"
            description={`${projects.length} project(s) added`}
            onClick={() =>
              setActivePage(
                "Projects"
              )
            }
          />

          <QuickAction
            code="I"
            title="Interview"
            description="Start new practice"
            onClick={() =>
              setActivePage(
                "Start Interview"
              )
            }
          />

          <QuickAction
            code="R"
            title="Reports"
            description={`${history.length} report(s)`}
            onClick={() =>
              setActivePage(
                "Interviews"
              )
            }
          />

        </div>

      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  symbol,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
          {symbol}
        </div>

      </div>

      <p className="mt-4 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

function ReadinessItem({
  completed,
  title,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          completed
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        {completed
          ? "✓"
          : "○"}
      </div>

      <p className="text-sm text-slate-600">
        {title}
      </p>

    </div>
  );
}

function QuickAction({
  code,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        {code}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </button>
  );
}

export default DashboardOverview;