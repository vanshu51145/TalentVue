import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import ResumeUpload from "./ResumeUpload";
import ProjectUpload from "./ProjectUpload";
import InterviewSetup from "./InterviewSetup";
import InterviewRoom from "./InterviewRoom";
import Report from "./Report";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import PreInterviewCheck from "./PreInterviewCheck";
import History from "./History";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [activePage, setActivePage] =
    useState("Overview");

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "talentVueCurrentUser"
    );

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      localStorage.removeItem(
        "talentVueCurrentUser"
      );

      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(
      "talentVueCurrentUser"
    );

    navigate("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500"></div>

          <p className="mt-4 text-sm text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main */}
      <div className="lg:ml-[270px]">
        
        <Topbar
          setSidebarOpen={setSidebarOpen}
          user={user}
        />

<main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

  {/* OVERVIEW */}
  {activePage === "Overview" && (
    <DashboardOverview
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* RESUME */}
  {activePage === "Resume" && (
    <ResumeUpload
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* PROJECTS */}
  {activePage === "Projects" && (
    <ProjectUpload
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* INTERVIEW HISTORY */}
  {activePage === "Interviews" && (
    <History
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* INTERVIEW SETUP */}
  {activePage === "Start Interview" && (
    <InterviewSetup
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* DEVICE CHECK */}
  {activePage === "Device Check" && (
    <PreInterviewCheck
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* INTERVIEW ROOM */}
  {activePage === "Interview Room" && (
    <InterviewRoom
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* LATEST INTERVIEW REPORT */}
  {activePage === "Interview Result" && (
    <Report
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* REPORTS */}
  {activePage === "Reports" && (
    <Report
      user={user}
      setActivePage={setActivePage}
    />
  )}

  {/* COMING SOON */}
  {activePage !== "Overview" &&
    activePage !== "Resume" &&
    activePage !== "Projects" &&
    activePage !== "Interviews" &&
    activePage !== "Start Interview" &&
    activePage !== "Device Check" &&
    activePage !== "Interview Room" &&
    activePage !== "Interview Result" &&
    activePage !== "Reports" && (
      <ComingSoon
        page={activePage}
        setActivePage={setActivePage}
      />
    )}

</main>
      </div>
    </div>
  );
}



function OverviewDashboard({
  user,
  setActivePage,
}) {
  const stats = [
    {
      title: "Total Interviews",
      value: "0",
      description: "Start your first interview",
      symbol: "I",
    },
    {
      title: "Average Score",
      value: "--",
      description: "No interview data yet",
      symbol: "%",
    },
    {
      title: "Projects Added",
      value: "0",
      description: "Add your project evidence",
      symbol: "P",
    },
    {
      title: "Practice Streak",
      value: "0",
      description: "Days in a row",
      symbol: "D",
    },
  ];

  return (
    <>
      {/* Heading */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Good to see you,{" "}
            {user.name.split(" ")[0]}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Track your progress and continue your
            interview preparation.
          </p>
        </div>

        <button
          onClick={() =>
            setActivePage("Start Interview")
          }
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
        >
          + Start Interview
        </button>
      </section>

      {/* Stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>

              <div className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                {stat.symbol}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              {stat.description}
            </p>
          </div>
        ))}
      </section>

      {/* Main Dashboard Grid */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        
        {/* Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Performance Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Your interview score progress
              </p>
            </div>

            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none sm:w-auto">
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>All time</option>
            </select>
          </div>

          {/* Empty Chart */}
          <div className="mt-6 flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <div className="max-w-xs px-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                %
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No performance data yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Complete your first mock interview
                to see your performance graph.
              </p>

              <button
                onClick={() =>
                  setActivePage(
                    "Start Interview"
                  )
                }
                className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Start Interview →
              </button>
            </div>
          </div>
        </div>

        {/* Profile Readiness */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">
            Profile Readiness
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Complete your profile for better interviews
          </p>

          {/* Progress Circle */}
          <div className="mt-7 flex justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-50">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-2xl font-bold text-indigo-600">
                  25%
                </span>

                <span className="text-[10px] text-slate-400">
                  Complete
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <ProfileItem
              completed
              title="Account Created"
            />

            <ProfileItem
              title="Upload Resume"
            />

            <ProfileItem
              title="Add Project"
            />

            <ProfileItem
              title="Complete First Interview"
            />
          </div>
        </div>
      </section>

      {/* Second Grid */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        
        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Continue building your interview profile
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickAction
              symbol="CV"
              title="Upload Resume"
              description="Build personalised questions"
              onClick={() =>
                setActivePage("Resume")
              }
            />

            <QuickAction
              symbol="P"
              title="Add Project"
              description="Prepare project defence"
              onClick={() =>
                setActivePage("Projects")
              }
            />

            <QuickAction
              symbol="I"
              title="Mock Interview"
              description="Start interview practice"
              onClick={() =>
                setActivePage(
                  "Start Interview"
                )
              }
            />

            <QuickAction
              symbol="R"
              title="View Reports"
              description="Track improvement"
              onClick={() =>
                setActivePage("Reports")
              }
            />
          </div>
        </div>

        {/* Focus Areas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Focus Areas
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Recommended areas to prepare
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
              Starter
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <FocusItem
              name="Project Explanation"
              percentage={70}
            />

            <FocusItem
              name="Technical Concepts"
              percentage={55}
            />

            <FocusItem
              name="HR Questions"
              percentage={45}
            />

            <FocusItem
              name="Communication"
              percentage={60}
            />
          </div>

          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            These values are temporary frontend demo
            data. Later they will be calculated from
            your actual interviews.
          </p>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent Interviews
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Your latest interview attempts
            </p>
          </div>

          <button
            onClick={() =>
              setActivePage("Interviews")
            }
            className="text-left text-sm font-semibold text-indigo-600 sm:text-right"
          >
            View All →
          </button>
        </div>

        <div className="flex min-h-[180px] items-center justify-center px-5 py-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-400">
              I
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No interviews completed
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Your completed interviews will
              appear here.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}



function ProfileItem({
  title,
  completed = false,
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
        {completed ? "✓" : "○"}
      </div>

      <p
        className={`text-sm ${
          completed
            ? "font-medium text-slate-700"
            : "text-slate-500"
        }`}
      >
        {title}
      </p>
    </div>
  );
}



function QuickAction({
  symbol,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <div className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        {symbol}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </button>
  );
}



function FocusItem({
  name,
  percentage,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          {name}
        </span>

        <span className="text-xs font-semibold text-slate-400">
          {percentage}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{
            width: `${percentage}%`,
          }}
        ></div>
      </div>
    </div>
  );
}



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

export default Dashboard;