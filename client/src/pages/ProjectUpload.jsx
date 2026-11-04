import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../utils/api";

function ProjectUpload({ user, setActivePage }) {
  const [projects, setProjects] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [screenshots, setScreenshots] = useState([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectType: "Personal",
    role: "",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
    contribution: "",
    challenges: "",
    outcome: "",
  });

  const storageKey = `talentVueProjects_${user?.id}`;

  // Load saved projects (backend first, localStorage fallback + safe migration)
  useEffect(() => {
    if (!user?.id) return;

    let localProjects = [];

    try {
      const savedProjects = localStorage.getItem(storageKey);

      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);

        if (Array.isArray(parsedProjects)) {
          localProjects = parsedProjects;
        }
      }
    } catch {
      localProjects = [];
    }

    let cancelled = false;

    const loadProjects = async () => {
      let response;

      // Offline / backend down -> local cache only, nothing rewritten
      try {
        response = await apiFetch("/api/projects");
      } catch {
        if (!cancelled) setProjects(localProjects);
        return;
      }

      if (cancelled) return;

      if (!response.ok || !Array.isArray(response.data.projects)) {
        setProjects(localProjects);
        return;
      }

      let serverProjects = response.data.projects.map((project) => ({
        ...project,
        id: project._id,
      }));

      // Migration: local-only projects get pushed to the server once.
      // Match by title (duplicate-safe); failed ones stay local, nothing is deleted.
      const migrateTargets = localProjects.filter(
        (localProject) =>
          !serverProjects.some(
            (serverProject) =>
              String(serverProject.title) === String(localProject.title)
          )
      );

      const failedMigrations = [];

      for (const localProject of migrateTargets) {
        const payload = {
          title: localProject.title,
          description: localProject.description,
          projectType: localProject.projectType || "Personal",
          role: localProject.role,
          technologies: Array.isArray(localProject.technologies)
            ? localProject.technologies
            : [],
          githubUrl: localProject.githubUrl || "",
          liveUrl: localProject.liveUrl || "",
          contribution: localProject.contribution,
          challenges: localProject.challenges || "",
          outcome: localProject.outcome || "",
          evidenceFiles: Array.isArray(localProject.evidenceFiles)
            ? localProject.evidenceFiles
            : [],
        };

        const hasRequired =
          payload.title &&
          payload.description &&
          payload.role &&
          payload.contribution &&
          payload.technologies.length > 0;

        try {
          const result = hasRequired
            ? await apiFetch("/api/projects", {
                method: "POST",
                body: payload,
              })
            : { ok: false };

          if (!result.ok || !result.data.project) {
            failedMigrations.push(localProject);
            continue;
          }

          serverProjects = [
            { ...result.data.project, id: result.data.project._id },
            ...serverProjects,
          ];
        } catch {
          failedMigrations.push(localProject);
        }
      }

      if (cancelled) return;

      const merged = [...serverProjects, ...failedMigrations];

      saveProjects(merged);
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, user?.id]);

  // Clean screenshot preview URLs
  useEffect(() => {
    return () => {
      screenshotPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [screenshotPreviews]);

  const saveProjects = (updatedProjects) => {
    setProjects(updatedProjects);

    localStorage.setItem(
      storageKey,
      JSON.stringify(updatedProjects)
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const validateUrl = (url) => {
    if (!url.trim()) return true;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Please enter the project title.");
      return false;
    }

    if (formData.title.trim().length < 3) {
      setError("Project title must contain at least 3 characters.");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Please enter the project description.");
      return false;
    }

    if (formData.description.trim().length < 20) {
      setError(
        "Project description should contain at least 20 characters."
      );
      return false;
    }

    if (!formData.role.trim()) {
      setError("Please mention your role in the project.");
      return false;
    }

    if (!formData.technologies.trim()) {
      setError("Please enter the technologies used.");
      return false;
    }

    if (!formData.contribution.trim()) {
      setError(
        "Please explain your exact contribution to the project."
      );
      return false;
    }

    if (!validateUrl(formData.githubUrl)) {
      setError(
        "Please enter a valid GitHub URL, including https://"
      );
      return false;
    }

    if (!validateUrl(formData.liveUrl)) {
      setError(
        "Please enter a valid live project URL, including https://"
      );
      return false;
    }

    return true;
  };

  const handleScreenshots = (event) => {
    setError("");

    const files = Array.from(event.target.files);

    if (!files.length) return;

    if (files.length > 3) {
      setError("You can upload a maximum of 3 screenshots.");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) =>
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
    );

    if (invalidFile) {
      setError(
        "Only JPG, PNG, and WEBP screenshots are allowed."
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 2 * 1024 * 1024
    );

    if (oversizedFile) {
      setError(
        "Each screenshot must be smaller than 2 MB."
      );

      event.target.value = "";
      return;
    }

    screenshotPreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    const previews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setScreenshots(files);
    setScreenshotPreviews(previews);
  };

  const removeScreenshots = () => {
    screenshotPreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    setScreenshots([]);
    setScreenshotPreviews([]);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      projectType: "Personal",
      role: "",
      technologies: "",
      githubUrl: "",
      liveUrl: "",
      contribution: "",
      challenges: "",
      outcome: "",
    });

    setEditingId(null);

    removeScreenshots();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) return;

    const technologiesArray = formData.technologies
      .split(",")
      .map((technology) => technology.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),

      description: formData.description.trim(),

      projectType: formData.projectType,

      role: formData.role.trim(),

      technologies: technologiesArray,

      githubUrl: formData.githubUrl.trim(),

      liveUrl: formData.liveUrl.trim(),

      contribution: formData.contribution.trim(),

      challenges: formData.challenges.trim(),

      outcome: formData.outcome.trim(),

      evidenceFiles: screenshots.map(
        (file) => file.name
      ),
    };

    try {
      if (editingId) {
        const { ok, data } = await apiFetch(
          `/api/projects/${editingId}`,
          {
            method: "PUT",
            body: payload,
          }
        );

        if (!ok) {
          setError(
            data.message ||
              "Failed to update project. Please try again."
          );
          return;
        }

        const updatedProjects = projects.map(
          (project) =>
            project.id === editingId
              ? {
                  ...data.project,
                  id: data.project._id,
                }
              : project
        );

        saveProjects(updatedProjects);

        setSuccess("Project updated successfully.");
      } else {
        const { ok, data } = await apiFetch(
          "/api/projects",
          {
            method: "POST",
            body: payload,
          }
        );

        if (!ok) {
          setError(
            data.message ||
              "Failed to save project. Please try again."
          );
          return;
        }

        const updatedProjects = [
          {
            ...data.project,
            id: data.project._id,
          },
          ...projects,
        ];

        saveProjects(updatedProjects);

        setSuccess(
          "Project evidence added successfully."
        );
      }

      resetForm();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch {
      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);

    setFormData({
      title: project.title || "",
      description: project.description || "",
      projectType:
        project.projectType || "Personal",
      role: project.role || "",

      technologies:
        project.technologies?.join(", ") || "",

      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      contribution: project.contribution || "",
      challenges: project.challenges || "",
      outcome: project.outcome || "",
    });

    removeScreenshots();

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      const { ok, data } = await apiFetch(
        `/api/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!ok) {
        setError(
          data.message ||
            "Failed to delete project. Please try again."
        );
        return;
      }

      const updatedProjects = projects.filter(
        (project) => project.id !== projectId
      );

      saveProjects(updatedProjects);

      if (editingId === projectId) {
        resetForm();
      }

      setSuccess("Project removed successfully.");
    } catch {
      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    }
  };

  const projectReadiness = useMemo(() => {
    if (!projects.length) return 0;

    const totalScore = projects.reduce(
      (total, project) => {
        let score = 40;

        if (project.githubUrl) score += 15;
        if (project.liveUrl) score += 10;
        if (project.challenges) score += 10;
        if (project.outcome) score += 10;

        if (
          project.evidenceFiles &&
          project.evidenceFiles.length > 0
        ) {
          score += 15;
        }

        return total + Math.min(score, 100);
      },
      0
    );

    return Math.round(
      totalScore / projects.length
    );
  }, [projects]);

  return (
    <div>
      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Project Evidence
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Build Your Project Proof
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add your projects, technologies, exact
            contribution, challenges and evidence so
            TalentVue can create deeper project-defence
            interview questions.
          </p>
        </div>

        <button
          onClick={() =>
            setActivePage("Overview")
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          ← Dashboard
        </button>
      </section>

      {/* SUMMARY */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Projects Added"
          value={projects.length}
          symbol="P"
        />

        <SummaryCard
          title="Evidence Readiness"
          value={`${projectReadiness}%`}
          symbol="%"
        />

        <SummaryCard
          title="Interview Status"
          value={
            projects.length
              ? "Ready"
              : "Pending"
          }
          symbol="✓"
        />
      </section>

      {/* SUCCESS */}
      {success && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          {error}
        </div>
      )}

      {/* FORM AND INFO */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId
                  ? "Edit Project"
                  : "Add New Project"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add details that you should be
                prepared to defend in an interview.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-left text-sm font-semibold text-slate-500 hover:text-indigo-600"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* TITLE */}
            <Field>
              <Label htmlFor="title">
                Project Title *
              </Label>

              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Smart Electricity Bill Estimator"
                className={inputStyle}
              />
            </Field>

            {/* TYPE */}
            <Field>
              <Label htmlFor="projectType">
                Project Type
              </Label>

              <select
                id="projectType"
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className={inputStyle}
              >
                <option>Personal</option>
                <option>Academic</option>
                <option>Internship</option>
                <option>Team</option>
                <option>Hackathon</option>
              </select>
            </Field>

            {/* ROLE */}
            <Field>
              <Label htmlFor="role">
                Your Role *
              </Label>

              <input
                id="role"
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Full Stack Developer"
                className={inputStyle}
              />
            </Field>

            {/* TECHNOLOGY */}
            <Field>
              <Label htmlFor="technologies">
                Technologies *
              </Label>

              <input
                id="technologies"
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                className={inputStyle}
              />

              <Helper>
                Separate technologies using commas.
              </Helper>
            </Field>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-5">
            <Label htmlFor="description">
              Project Description *
            </Label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Explain what the project does and what problem it solves..."
              className={textareaStyle}
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {formData.description.length} characters
            </div>
          </div>

          {/* URLS */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field>
              <Label htmlFor="githubUrl">
                GitHub Repository
              </Label>

              <input
                id="githubUrl"
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className={inputStyle}
              />
            </Field>

            <Field>
              <Label htmlFor="liveUrl">
                Live Project URL
              </Label>

              <input
                id="liveUrl"
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="https://your-project.com"
                className={inputStyle}
              />
            </Field>
          </div>

          {/* CONTRIBUTION */}
          <div className="mt-5">
            <Label htmlFor="contribution">
              Your Exact Contribution *
            </Label>

            <textarea
              id="contribution"
              name="contribution"
              value={formData.contribution}
              onChange={handleChange}
              rows="4"
              placeholder="What features did you personally build? Which modules, pages, APIs, database logic, UI or functionality did you handle?"
              className={textareaStyle}
            />

            <Helper>
              This is one of the most important
              sections for project-defence questions.
            </Helper>
          </div>

          {/* CHALLENGES */}
          <div className="mt-5">
            <Label htmlFor="challenges">
              Challenges Faced
            </Label>

            <textarea
              id="challenges"
              name="challenges"
              value={formData.challenges}
              onChange={handleChange}
              rows="3"
              placeholder="Describe a difficult bug, technical limitation or development challenge..."
              className={textareaStyle}
            />
          </div>

          {/* OUTCOME */}
          <div className="mt-5">
            <Label htmlFor="outcome">
              Result / Outcome
            </Label>

            <textarea
              id="outcome"
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              rows="3"
              placeholder="What was achieved? Was the project deployed, tested, used by students, or completed successfully?"
              className={textareaStyle}
            />
          </div>

          {/* SCREENSHOTS */}
          <div className="mt-6">
            <Label>
              Project Evidence Screenshots
            </Label>

            <label className="mt-2 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-600">
                IMG
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Upload project screenshots
              </p>

              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG or WEBP • Up to 3 images •
                Maximum 2 MB each
              </p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleScreenshots}
                className="hidden"
              />
            </label>

            {screenshotPreviews.length > 0 && (
              <div className="mt-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {screenshotPreviews.map(
                    (preview, index) => (
                      <div
                        key={preview}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={preview}
                          alt={`Project evidence ${
                            index + 1
                          }`}
                          className="h-36 w-full object-cover"
                        />

                        <p className="truncate px-3 py-2 text-xs text-slate-500">
                          {screenshots[index]?.name}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={removeScreenshots}
                  className="mt-3 text-xs font-semibold text-red-500"
                >
                  Remove screenshots
                </button>
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {editingId
                ? "Update Project"
                : "+ Add Project Evidence"}
            </button>
          </div>
        </form>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* READINESS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">
              Evidence Readiness
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Overall project preparation
            </p>

            <div className="mt-7 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-50">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                  <p className="text-2xl font-bold text-indigo-600">
                    {projectReadiness}%
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Ready
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <EvidenceItem
                completed={projects.length > 0}
                text="Project details added"
              />

              <EvidenceItem
                completed={projects.some(
                  (project) => project.githubUrl
                )}
                text="GitHub evidence"
              />

              <EvidenceItem
                completed={projects.some(
                  (project) => project.liveUrl
                )}
                text="Live project link"
              />

              <EvidenceItem
                completed={projects.some(
                  (project) =>
                    project.evidenceFiles?.length
                )}
                text="Visual evidence"
              />
            </div>
          </div>

          {/* INTERVIEW TIP */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
              AI
            </div>

            <h3 className="mt-4 font-bold text-indigo-950">
              What will TalentVue ask?
            </h3>

            <p className="mt-3 text-sm leading-6 text-indigo-900/70">
              Your interview can include questions
              about technology choices, architecture,
              challenges, personal contribution,
              scalability and project limitations.
            </p>
          </div>

          {/* EXAMPLE */}
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
              Example
            </p>

            <h3 className="mt-3 font-bold text-white">
              Project Defence Question
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              “You mentioned using Local Storage.
              Why was it suitable for your project,
              and what would you replace it with if
              multiple users needed synchronized data?”
            </p>
          </div>
        </div>
      </section>

      {/* SAVED PROJECTS */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Your Evidence
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Saved Projects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage projects that may be used for
              future interview questions.
            </p>
          </div>

          {projects.length > 0 && (
            <p className="text-sm font-semibold text-slate-500">
              {projects.length}{" "}
              {projects.length === 1
                ? "project"
                : "projects"}
            </p>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* NEXT STEP */}
      {projects.length > 0 && (
        <section className="mt-8 rounded-2xl bg-slate-950 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
                Next Step
              </p>

              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Your project evidence is ready.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Configure your target role and
                interview type to begin project-based
                interview preparation.
              </p>
            </div>

            <button
              onClick={() =>
                setActivePage("Start Interview")
              }
              className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 lg:w-auto"
            >
              Continue to Interview →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}



const inputStyle =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const textareaStyle =
  "mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";



function Field({ children }) {
  return <div>{children}</div>;
}



function Label({
  htmlFor,
  children,
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-slate-700"
    >
      {children}
    </label>
  );
}



function Helper({ children }) {
  return (
    <p className="mt-1.5 text-xs leading-5 text-slate-400">
      {children}
    </p>
  );
}



function SummaryCard({
  title,
  value,
  symbol,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
          {symbol}
        </div>
      </div>
    </div>
  );
}



function EvidenceItem({
  completed,
  text,
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

      <p className="text-sm text-slate-600">
        {text}
      </p>
    </div>
  );
}



function EmptyProjects() {
  return (
    <div className="mt-6 flex min-h-[230px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600">
          P
        </div>

        <h3 className="mt-4 font-bold text-slate-800">
          No project evidence added
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Fill the project form above to create
          your first project-defence profile.
        </p>
      </div>
    </div>
  );
}



function ProjectCard({
  project,
  handleEdit,
  handleDelete,
}) {
  const evidenceCount =
    project.evidenceFiles?.length || 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
            P
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {project.title}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {project.projectType} Project •{" "}
              {project.role}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
          Evidence
        </span>
      </div>

      {/* Description */}
      <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500">
        {project.description}
      </p>

      {/* Technology */}
      <div className="mt-5 flex flex-wrap gap-2">
        {project.technologies?.map(
          (technology) => (
            <span
              key={technology}
              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
            >
              {technology}
            </span>
          )
        )}
      </div>

      {/* Contribution */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Your Contribution
        </p>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {project.contribution}
        </p>
      </div>

      {/* Evidence */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <EvidenceStatus
          title="GitHub"
          available={Boolean(
            project.githubUrl
          )}
        />

        <EvidenceStatus
          title="Live"
          available={Boolean(project.liveUrl)}
        />

        <EvidenceStatus
          title="Images"
          available={evidenceCount > 0}
          value={
            evidenceCount
              ? evidenceCount
              : undefined
          }
        />
      </div>

      {/* Links */}
      {(project.githubUrl ||
        project.liveUrl) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View GitHub ↗
            </a>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Live Project ↗
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
        <button
          onClick={() => handleEdit(project)}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit
        </button>

        <button
          onClick={() =>
            handleDelete(project.id)
          }
          className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}



function EvidenceStatus({
  title,
  available,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className="text-[10px] text-slate-400">
        {title}
      </p>

      <p
        className={`mt-1 text-xs font-bold ${
          available
            ? "text-emerald-600"
            : "text-slate-400"
        }`}
      >
        {available
          ? value || "✓"
          : "—"}
      </p>
    </div>
  );
}

export default ProjectUpload;