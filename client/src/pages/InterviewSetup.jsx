import { useEffect, useMemo, useState } from "react";

function InterviewSetup({ user, setActivePage }) {
  const [resume, setResume] = useState(null);
  const [projects, setProjects] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    targetRole: "",
    experienceLevel: "Fresher",
    interviewType: "Mixed",
    difficulty: "Medium",
    duration: "20",
    questionCount: "10",
    selectedProjectId: "",
    useResume: true,
    useProjectEvidence: true,
    jobDescription: "",
  });

  const resumeKey = `talentVueResume_${user?.id}`;
  const projectsKey = `talentVueProjects_${user?.id}`;
  const setupKey = `talentVueInterviewSetup_${user?.id}`;

  // Load resume, projects and previous setup
  useEffect(() => {
    if (!user?.id) return;

    const savedResume = localStorage.getItem(resumeKey);
    const savedProjects = localStorage.getItem(projectsKey);
    const savedSetup = localStorage.getItem(setupKey);

    let parsedResume = null;
    let parsedProjects = [];

    if (savedResume) {
      try {
        parsedResume = JSON.parse(savedResume);
        setResume(parsedResume);
      } catch {
        console.log("Unable to load resume.");
      }
    }

    if (savedProjects) {
      try {
        parsedProjects = JSON.parse(savedProjects);

        if (Array.isArray(parsedProjects)) {
          setProjects(parsedProjects);
        }
      } catch {
        console.log("Unable to load projects.");
      }
    }

    if (savedSetup) {
      try {
        const parsedSetup = JSON.parse(savedSetup);

        setFormData((previous) => ({
          ...previous,
          ...parsedSetup,
        }));

        return;
      } catch {
        console.log("Unable to load interview setup.");
      }
    }

    // Auto-fill from resume
    if (parsedResume?.analysis?.profileType) {
      setFormData((previous) => ({
        ...previous,
        targetRole: parsedResume.analysis.profileType,
      }));
    }

    // Automatically select first project
    if (parsedProjects.length > 0) {
      setFormData((previous) => ({
        ...previous,
        selectedProjectId: String(parsedProjects[0].id),
      }));
    }
  }, [user?.id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess("");
  };

  const selectedProject = useMemo(() => {
    return projects.find(
      (project) =>
        String(project.id) ===
        String(formData.selectedProjectId)
    );
  }, [projects, formData.selectedProjectId]);

  const validateSetup = () => {
    if (!formData.targetRole.trim()) {
      setError("Please enter or select a target job role.");
      return false;
    }

    if (
      formData.interviewType === "Project Defence" &&
      projects.length === 0
    ) {
      setError(
        "Please add at least one project before starting a Project Defence interview."
      );
      return false;
    }

    if (
      formData.interviewType === "Project Defence" &&
      !formData.selectedProjectId
    ) {
      setError(
        "Please select the project you want to defend."
      );
      return false;
    }

    if (
      formData.useProjectEvidence &&
      projects.length === 0
    ) {
      setError(
        "Project evidence is enabled, but no project has been added."
      );
      return false;
    }

    return true;
  };

  const createSetupData = () => {
    return {
      ...formData,

      targetRole: formData.targetRole.trim(),

      selectedProjectTitle:
        selectedProject?.title || "",

      resumeAvailable: Boolean(resume),

      resumeAnalyzed:
        resume?.status === "analyzed",

      projectEvidenceAvailable:
        projects.length > 0,

      createdAt: new Date().toISOString(),
    };
  };

  const handleSaveSetup = () => {
    if (!validateSetup()) return;

    const setupData = createSetupData();

    localStorage.setItem(
      setupKey,
      JSON.stringify(setupData)
    );

    setSuccess("Interview setup saved successfully.");
  };

  const handleStartInterview = () => {
    if (!validateSetup()) return;

    const setupData = createSetupData();

    localStorage.setItem(
      setupKey,
      JSON.stringify(setupData)
    );

    localStorage.setItem(
      `talentVuePendingInterview_${user.id}`,
      JSON.stringify({
        ...setupData,

        status: "ready",

        sessionId: Date.now(),
      })
    );

    setActivePage("Interview Room");
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Mock Interview
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Configure Your Interview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Choose your target role, interview type,
            difficulty and evidence sources to create a
            personalised TalentVue interview.
          </p>
        </div>

        <button
          onClick={() => setActivePage("Overview")}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          ← Dashboard
        </button>
      </section>

      {/* PREPARATION STATUS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Resume"
          value={resume ? "Available" : "Missing"}
          completed={Boolean(resume)}
        />

        <StatusCard
          title="Resume Analysis"
          value={
            resume?.status === "analyzed"
              ? "Complete"
              : "Pending"
          }
          completed={resume?.status === "analyzed"}
        />

        <StatusCard
          title="Projects"
          value={projects.length}
          completed={projects.length > 0}
        />

        <StatusCard
          title="Interview"
          value="Configure"
          completed={false}
        />
      </section>

      {/* MESSAGES */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* LEFT */}
        <div className="space-y-6">

          {/* TARGET */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="01"
              title="Target Position"
              description="Tell TalentVue what kind of interview you want to prepare for."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="targetRole">
                  Target Job Role *
                </Label>

                <input
                  id="targetRole"
                  name="targetRole"
                  type="text"
                  value={formData.targetRole}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Developer"
                  className={inputStyle}
                />

                {resume?.analysis?.profileType && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((previous) => ({
                        ...previous,
                        targetRole:
                          resume.analysis.profileType,
                      }))
                    }
                    className="mt-2 text-xs font-semibold text-indigo-600"
                  >
                    Use detected role:{" "}
                    {resume.analysis.profileType}
                  </button>
                )}
              </div>

              <div>
                <Label htmlFor="experienceLevel">
                  Experience Level
                </Label>

                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option>Fresher</option>
                  <option>Internship</option>
                  <option>Junior</option>
                  <option>Intermediate</option>
                </select>
              </div>
            </div>

            {/* Popular Roles */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500">
                Popular roles
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Frontend Developer",
                  "Backend Developer",
                  "Full Stack Developer",
                  "Software Engineer",
                  "Java Developer",
                  "Python Developer",
                  "Data Analyst",
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() =>
                      setFormData((previous) => ({
                        ...previous,
                        targetRole: role,
                      }))
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      formData.targetRole === role
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INTERVIEW TYPE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="02"
              title="Interview Type"
              description="Select what the interviewer should focus on."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InterviewTypeCard
                title="Technical"
                code="TECH"
                description="Programming, concepts, frameworks and problem solving."
                selected={
                  formData.interviewType === "Technical"
                }
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    interviewType: "Technical",
                  }))
                }
              />

              <InterviewTypeCard
                title="HR"
                code="HR"
                description="Introduction, strengths, weaknesses and behavioural questions."
                selected={
                  formData.interviewType === "HR"
                }
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    interviewType: "HR",
                  }))
                }
              />

              <InterviewTypeCard
                title="Project Defence"
                code="DEV"
                description="Deep questions about projects, decisions and contribution."
                selected={
                  formData.interviewType ===
                  "Project Defence"
                }
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    interviewType:
                      "Project Defence",
                    useProjectEvidence: true,
                  }))
                }
              />

              <InterviewTypeCard
                title="Mixed"
                code="ALL"
                description="Technical, HR, resume and project questions together."
                selected={
                  formData.interviewType === "Mixed"
                }
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    interviewType: "Mixed",
                  }))
                }
              />
            </div>
          </div>

          {/* DIFFICULTY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="03"
              title="Interview Difficulty"
              description="Choose how challenging your interview should be."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  name: "Easy",
                  text: "Basic concepts and direct questions.",
                },
                {
                  name: "Medium",
                  text: "Concepts, examples and follow-up questions.",
                },
                {
                  name: "Hard",
                  text: "Deep technical reasoning and challenging follow-ups.",
                },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      difficulty: item.name,
                    }))
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    formData.difficulty === item.name
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/10"
                      : "border-slate-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      {item.name}
                    </p>

                    <span
                      className={`h-4 w-4 rounded-full border-4 ${
                        formData.difficulty === item.name
                          ? "border-indigo-600 bg-white"
                          : "border-slate-300"
                      }`}
                    ></span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* DURATION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="04"
              title="Interview Length"
              description="Control the approximate duration and number of questions."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="duration">
                  Duration
                </Label>

                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="10">10 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                </select>
              </div>

              <div>
                <Label htmlFor="questionCount">
                  Number of Questions
                </Label>

                <select
                  id="questionCount"
                  name="questionCount"
                  value={formData.questionCount}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                </select>
              </div>
            </div>
          </div>

          {/* EVIDENCE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="05"
              title="Interview Evidence"
              description="Choose the information TalentVue should use when creating questions."
            />

            <div className="mt-6 space-y-4">
              <EvidenceToggle
                title="Use Resume"
                description={
                  resume
                    ? `Use ${resume.fileName} for personalised resume questions.`
                    : "No resume has been uploaded."
                }
                checked={formData.useResume}
                disabled={!resume}
                onChange={(checked) =>
                  setFormData((previous) => ({
                    ...previous,
                    useResume: checked,
                  }))
                }
              />

              <EvidenceToggle
                title="Use Project Evidence"
                description={
                  projects.length
                    ? `Use your ${projects.length} saved project(s) for project-defence questions.`
                    : "No project evidence has been added."
                }
                checked={
                  formData.useProjectEvidence
                }
                disabled={projects.length === 0}
                onChange={(checked) =>
                  setFormData((previous) => ({
                    ...previous,
                    useProjectEvidence: checked,
                  }))
                }
              />
            </div>

            {formData.useProjectEvidence &&
              projects.length > 0 && (
                <div className="mt-6">
                  <Label htmlFor="selectedProjectId">
                    Primary Project
                  </Label>

                  <select
                    id="selectedProjectId"
                    name="selectedProjectId"
                    value={
                      formData.selectedProjectId
                    }
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="">
                      Select a project
                    </option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.title}
                      </option>
                    ))}
                  </select>

                  {selectedProject && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Selected Project
                      </p>

                      <h3 className="mt-2 font-semibold text-slate-800">
                        {selectedProject.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedProject.projectType} •{" "}
                        {selectedProject.role}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedProject.technologies
                          ?.slice(0, 6)
                          .map((technology) => (
                            <span
                              key={technology}
                              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600"
                            >
                              {technology}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* JOB DESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="06"
              title="Job Description"
              description="Optional: paste a job description to make the interview more role-specific."
            />

            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              rows="7"
              placeholder="Paste the target company's job description here..."
              className={textareaStyle}
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              In the AI phase, TalentVue will compare
              your resume and projects against this job
              description.
            </p>
          </div>
        </div>

        {/* RIGHT SUMMARY */}
        <div className="space-y-6 xl:sticky xl:top-[97px] xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Interview Summary
            </p>

            <h2 className="mt-2 text-lg font-bold text-slate-900">
              Your Session
            </h2>

            <div className="mt-6 space-y-4">
              <SummaryRow
                label="Target Role"
                value={
                  formData.targetRole ||
                  "Not selected"
                }
              />

              <SummaryRow
                label="Experience"
                value={formData.experienceLevel}
              />

              <SummaryRow
                label="Interview Type"
                value={formData.interviewType}
              />

              <SummaryRow
                label="Difficulty"
                value={formData.difficulty}
              />

              <SummaryRow
                label="Duration"
                value={`${formData.duration} min`}
              />

              <SummaryRow
                label="Questions"
                value={formData.questionCount}
              />

              <SummaryRow
                label="Resume"
                value={
                  formData.useResume && resume
                    ? "Included"
                    : "Not included"
                }
              />

              <SummaryRow
                label="Project"
                value={
                  formData.useProjectEvidence &&
                  selectedProject
                    ? selectedProject.title
                    : "Not selected"
                }
              />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleSaveSetup}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
              >
                Save Setup
              </button>

              <button
                type="button"
                onClick={handleStartInterview}
                className="mt-3 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Start Interview →
              </button>
            </div>
          </div>

          {/* Interview Flow */}
          <div className="rounded-2xl bg-slate-950 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
              Interview Flow
            </p>

            <div className="mt-5 space-y-4">
              <FlowItem
                number="1"
                text="Introduction question"
              />

              <FlowItem
                number="2"
                text={`${formData.interviewType} questions`}
              />

              <FlowItem
                number="3"
                text="Adaptive follow-ups"
              />

              <FlowItem
                number="4"
                text="Performance feedback"
              />
            </div>
          </div>

          {/* Preparation Tip */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Before Starting
            </p>

            <p className="mt-3 text-sm leading-6 text-amber-800">
              Sit in a quiet environment and make sure
              you can explain the technologies and
              projects selected for this interview.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const inputStyle =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const textareaStyle =
  "mt-5 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-slate-700"
    >
      {children}
    </label>
  );
}

function SectionHeader({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
        {number}
      </div>

      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  completed,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">
            {title}
          </p>

          <p className="mt-2 font-bold text-slate-800">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
            completed
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {completed ? "✓" : "○"}
        </div>
      </div>
    </div>
  );
}

function InterviewTypeCard({
  title,
  code,
  description,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        selected
          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/10"
          : "border-slate-200 bg-white hover:border-indigo-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-xs font-bold ${
            selected
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {code}
        </div>

        <span
          className={`h-4 w-4 rounded-full border-4 ${
            selected
              ? "border-indigo-600 bg-white"
              : "border-slate-300"
          }`}
        ></span>
      </div>

      <h3 className="mt-4 font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

function EvidenceToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        disabled
          ? "border-slate-200 bg-slate-50 opacity-60"
          : checked
          ? "border-indigo-200 bg-indigo-50/50"
          : "border-slate-200"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 min-w-12 rounded-full transition ${
          checked && !disabled
            ? "bg-indigo-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked && !disabled
              ? "left-6"
              : "left-1"
          }`}
        ></span>
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="max-w-[60%] text-right text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FlowItem({ number, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400">
        {number}
      </div>

      <p className="text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}

export default InterviewSetup;