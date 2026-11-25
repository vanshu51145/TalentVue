import {
  useLocation,
  useOutletContext,
} from "react-router-dom";

import ResumeUpload from "./ResumeUpload";
import ProjectUpload from "./ProjectUpload";
import InterviewSetup from "./InterviewSetup";
import InterviewRoom from "./InterviewRoom";
import Report from "./Report";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import PreInterviewCheck from "./PreInterviewCheck";
import History from "./History";
import { getPageForPath } from "../utils/dashboardPages";

function ComingSoon({
  page,
  setActivePage,
}) {
  let title = page;
  let description =
    "This module will be connected in the next development part.";

  if (page === "Resume") {
    description =
      "Upload and analyse your resume to generate personalised interview questions.";
  }

  if (page === "Projects") {
    description =
      "Add project details and evidence for project-defence interview preparation.";
  }

  if (page === "Interviews") {
    description =
      "Your interview history and attempts will appear here.";
  }

  if (page === "Reports") {
    description =
      "Detailed interview scores and improvement reports will appear here.";
  }

  if (page === "Start Interview") {
    title = "Start Mock Interview";

    description =
      "Interview setup, role selection, difficulty and interview type will be built in the upcoming interview module.";
  }

  return (
    <section className="flex min-h-[calc(100vh-130px)] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600">
          T
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
          TalentVue AI
        </p>

        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>

        <button
          onClick={() =>
            setActivePage("Overview")
          }
          className="mt-7 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    </section>
  );
}

// Reads the Outlet context and keeps the exact
// { user, setActivePage } props every page component already expects
export function DashboardChild({
  page,
}) {
  const { user, setActivePage } =
    useOutletContext();

  const location = useLocation();

  if (page === "coming-soon") {
    return (
      <ComingSoon
        page={getPageForPath(
          location.pathname
        )}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "resume") {
    return (
      <ResumeUpload
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "projects") {
    return (
      <ProjectUpload
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "interviews") {
    return (
      <History
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "reports") {
    return (
      <Report
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "start-interview") {
    return (
      <InterviewSetup
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "device-check") {
    return (
      <PreInterviewCheck
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "interview-room") {
    return (
      <InterviewRoom
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  if (page === "interview-result") {
    return (
      <Report
        user={user}
        setActivePage={setActivePage}
      />
    );
  }

  // "overview" (index route)
  return (
    <DashboardOverview
      user={user}
      setActivePage={setActivePage}
    />
  );
}
