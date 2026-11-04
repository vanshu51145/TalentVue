import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "../utils/api";

import {
  calculateInterviewScore,
  clearInterviewHistory,
  deleteInterviewFromHistory,
  formatInterviewDate,
  getInterviewHistory,
  saveInterviewHistory,
  setLatestCompletedInterview,
} from "../utils/storage";

function History({
  user,
  setActivePage,
}) {
  const [history, setHistory] =
    useState(() =>
      getInterviewHistory(
        user.id
      )
    );

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [message, setMessage] =
    useState("");

  // Backend sync: server first, localStorage fallback + one-time migration
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const localHistory =
      getInterviewHistory(user.id);

    const loadHistory = async () => {
      let response;

      try {
        response = await apiFetch(
          "/api/interviews"
        );
      } catch {
        if (!cancelled) {
          setHistory(localHistory);
        }
        return;
      }

      if (cancelled) return;

      if (
        !response.ok ||
        !Array.isArray(
          response.data.interviews
        )
      ) {
        setHistory(localHistory);
        return;
      }

      const serverHistory = [
        ...response.data.interviews,
      ];

      // Migration: local-only sessions pushed once; sessionId = dedupe key.
      // Failed ones stay local; nothing is silently discarded.
      const missing = localHistory.filter(
        (localInterview) =>
          !serverHistory.some(
            (serverInterview) =>
              String(
                serverInterview.sessionId
              ) ===
              String(
                localInterview.sessionId
              )
          )
      );

      const failedMigration = [];

      for (const localInterview of missing) {
        const hasData =
          localInterview.setup &&
          Array.isArray(
            localInterview.answers
          );

        try {
          const result = hasData
            ? await apiFetch(
                "/api/interviews",
                {
                  method: "POST",
                  body: {
                    sessionId:
                      localInterview.sessionId,
                    setup:
                      localInterview.setup,
                    answers:
                      localInterview.answers,
                    totalQuestions:
                      localInterview.totalQuestions,
                    answeredQuestions:
                      localInterview.answeredQuestions,
                    skippedQuestions:
                      localInterview.skippedQuestions,
                    completedAt:
                      localInterview.completedAt,
                    status:
                      localInterview.status ||
                      "completed",
                  },
                }
              )
            : { ok: false };

          if (
            result.ok &&
            result.data.interview
          ) {
            serverHistory.push(
              result.data.interview
            );
          } else {
            failedMigration.push(
              localInterview
            );
          }
        } catch {
          failedMigration.push(
            localInterview
          );
        }
      }

      if (cancelled) return;

      const seen = new Set();

      const merged = [
        ...serverHistory,
        ...failedMigration,
      ]
        .filter((item) => {
          const key = String(
            item.sessionId
          );

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        })
        .sort(
          (a, b) =>
            new Date(
              a.completedAt
            ) -
            new Date(b.completedAt)
        );

      setHistory(merged);

      saveInterviewHistory(
        user.id,
        merged
      );
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredHistory =
    useMemo(() => {
      return [...history]
        .reverse()
        .filter(
          (interview) => {
            const role =
              interview.setup
                ?.targetRole ||
              "";

            const type =
              interview.setup
                ?.interviewType ||
              "";

            const matchesSearch =
              role
                .toLowerCase()
                .includes(
                  search.toLowerCase()
                );

            const matchesFilter =
              filter === "All" ||
              type === filter;

            return (
              matchesSearch &&
              matchesFilter
            );
          }
        );
    }, [
      history,
      search,
      filter,
    ]);

  const handleViewReport = (
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

  const handleDelete = async (
    sessionId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this interview from your history?"
      );

    if (!confirmed) {
      return;
    }

    const interview = history.find(
      (item) =>
        String(item.sessionId) ===
        String(sessionId)
    );

    try {
      if (interview?._id) {
        const { ok, data } =
          await apiFetch(
            `/api/interviews/${interview._id}`,
            {
              method: "DELETE",
            }
          );

        if (!ok) {
          setMessage(
            data.message ||
              "Failed to delete interview. Please try again."
          );
          return;
        }
      }

      const updated =
        deleteInterviewFromHistory(
          user.id,
          sessionId
        );

      setHistory(updated);

      setMessage(
        "Interview deleted successfully."
      );
    } catch {
      setMessage(
        "Unable to connect to server. Please make sure the backend is running."
      );
    }
  };

  const handleClearHistory =
    async () => {
      if (!history.length) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete your complete interview history?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const { ok, data } =
          await apiFetch(
            "/api/interviews",
            {
              method: "DELETE",
            }
          );

        if (!ok) {
          setMessage(
            data.message ||
              "Failed to clear history. Please try again."
          );
          return;
        }

        clearInterviewHistory(
          user.id
        );

        setHistory([]);

        setMessage(
          "Interview history cleared."
        );
      } catch {
        setMessage(
          "Unable to connect to server. Please make sure the backend is running."
        );
      }
    };

  return (
    <div>

      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Practice History
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Interview History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your previous
            interviews, scores and
            reports.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          <button
            onClick={() =>
              setActivePage(
                "Overview"
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Dashboard
          </button>

          <button
            onClick={() =>
              setActivePage(
                "Start Interview"
              )
            }
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + New Interview
          </button>

        </div>

      </section>

      {message && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* FILTER */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="w-full lg:max-w-md">

            <input
              type="text"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by job role..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />

          </div>

          <div className="flex flex-wrap gap-2">

            {[
              "All",
              "Technical",
              "HR",
              "Project Defence",
              "Mixed",
            ].map(
              (type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFilter(type)
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filter ===
                    type
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50"
                  }`}
                >
                  {type}
                </button>
              )
            )}

          </div>

        </div>

      </section>

      {/* HISTORY */}
      {filteredHistory.length ===
      0 ? (
        <section className="mt-6 flex min-h-[330px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">

          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600">
              I
            </div>

            <h2 className="mt-5 font-bold text-slate-800">
              No interviews found
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Complete an interview
              to build your practice
              history.
            </p>

            <button
              onClick={() =>
                setActivePage(
                  "Start Interview"
                )
              }
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Start Interview
            </button>
          </div>

        </section>
      ) : (
        <section className="mt-6 space-y-4">

          {filteredHistory.map(
            (
              interview,
              index
            ) => {
              const score =
                calculateInterviewScore(
                  interview
                );

              return (
                <article
                  key={
                    interview.sessionId
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex gap-4">

                      <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                        {history.length -
                          index}
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="font-bold text-slate-900">
                            {interview
                              .setup
                              ?.targetRole ||
                              "Interview"}
                          </h2>

                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold text-indigo-600">
                            {
                              interview
                                .setup
                                ?.interviewType
                            }
                          </span>

                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {
                            interview
                              .setup
                              ?.difficulty
                          }
                          {" • "}
                          {
                            interview
                              .setup
                              ?.experienceLevel
                          }
                          {" • "}
                          {formatInterviewDate(
                            interview.completedAt
                          )}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {
                            interview.answeredQuestions
                          }
                          /
                          {
                            interview.totalQuestions
                          }{" "}
                          questions
                          answered
                        </p>

                      </div>

                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      <div className="rounded-xl bg-slate-50 px-5 py-3 text-center">

                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Score
                        </p>

                        <p
                          className={`mt-1 text-2xl font-bold ${
                            score >=
                            80
                              ? "text-emerald-600"
                              : score >=
                                60
                              ? "text-indigo-600"
                              : "text-amber-600"
                          }`}
                        >
                          {score}%
                        </p>

                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleViewReport(
                              interview
                            )
                          }
                          className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          View Report
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              interview.sessionId
                            )
                          }
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </article>
              );
            }
          )}

          <div className="pt-3 text-right">

            <button
              onClick={
                handleClearHistory
              }
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              Clear Complete History
            </button>

          </div>

        </section>
      )}

    </div>
  );
}

export default History;