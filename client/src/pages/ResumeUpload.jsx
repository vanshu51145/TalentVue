import { useEffect, useRef, useState } from "react";

import { apiFetch } from "../utils/api";

const getFileFormat = (fileName = "", fileType = "") => {
  const extension = String(fileName)
    .toLowerCase()
    .split(".")
    .pop();

  if (
    extension === "pdf" ||
    fileType === "application/pdf"
  ) {
    return "PDF";
  }

  if (
    extension === "docx" ||
    String(fileType).includes(
      "wordprocessingml"
    )
  ) {
    return "DOCX";
  }

  if (
    extension === "doc" ||
    fileType === "application/msword"
  ) {
    return "DOC";
  }

  return "FILE";
};

function ResumeUpload({ user, setActivePage }) {
  const fileInputRef = useRef(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const [error, setError] = useState("");

  const [savedResume, setSavedResume] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [analysis, setAnalysis] = useState(null);

  const storageKey = `talentVueResume_${user?.id}`;

  // Load saved resume metadata, then refresh it from the backend
  useEffect(() => {
    if (!user?.id) return;

    let cachedAnalysis = null;
    let cachedAnalysisSource = null;

    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);

        setSavedResume(parsedData);

        cachedAnalysis = parsedData.analysis || null;
        cachedAnalysisSource =
          parsedData.analysisSource || null;

        if (
          parsedData.analysis &&
          cachedAnalysisSource === "ai"
        ) {
          setAnalysis(parsedData.analysis);
        }
      } catch {
        console.log("Unable to load saved resume.");
      }
    }

    // Backend-first refresh: localStorage is per-device, so a
    // browser on another device must read the server copy instead
    const loadResumeFromBackend = async () => {
      try {
        const { ok, data } = await apiFetch(
          "/api/resume"
        );

        if (
          !ok ||
          !data ||
          !data.resume
        ) {
          // 404 (no resume yet) and other non-OK
          // responses keep the cached state
          return;
        }

        const metadata = {
          id: data.resume.id,
          fileName: data.resume.fileName,
          fileSize: data.resume.fileSize,
          fileType: data.resume.fileType,
          filePath: data.resume.filePath ?? "",
          uploadedAt: data.resume.uploadedAt,
          status: "uploaded",
          analysis: cachedAnalysis,
          analysisSource: cachedAnalysisSource,
        };

        setSavedResume(metadata);

        localStorage.setItem(
          storageKey,
          JSON.stringify(metadata)
        );
      } catch {
        // Network failure: keep the cached
        // metadata and never erase it
        console.log(
          "Unable to fetch resume. Keeping locally cached resume metadata."
        );
      }
    };

    loadResumeFromBackend();
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadLatestAnalysis = async () => {
      try {
        const { ok, data } = await apiFetch(
          "/api/resume/analysis"
        );

        if (
          !ok ||
          !data ||
          !Array.isArray(data.analyses) ||
          !data.analyses.length ||
          !data.analyses[0].analysis
        ) {
          return;
        }

        const latestAnalysis =
          data.analyses[0].analysis;

        setAnalysis(latestAnalysis);

        setSavedResume((previous) => {
          if (!previous) return previous;

          const metadata = {
            ...previous,
            status: "analyzed",
            analysis: latestAnalysis,
            analysisSource: "ai",
          };

          localStorage.setItem(
            storageKey,
            JSON.stringify(metadata)
          );

          return metadata;
        });
      } catch {
        console.log(
          "Unable to fetch saved AI resume analysis."
        );
      }
    };

    loadLatestAnalysis();
  }, [storageKey, user?.id]);

  // Create a local object URL for the selected file preview
  useEffect(() => {
    if (!resumeFile) {
      setPreviewURL("");
      return undefined;
    }

    const url = URL.createObjectURL(resumeFile);

    setPreviewURL(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [resumeFile]);

  // Validate selected file
  const validateFile = (file) => {
    setError("");

    if (!file) {
      return false;
    }

    const format = getFileFormat(
      file.name,
      file.type
    );

    if (format === "FILE") {
      setError(
        "Only PDF, DOC and DOCX resume files are allowed."
      );
      return false;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must not exceed 10 MB."
      );
      return false;
    }

    return true;
  };

  // Select and upload resume
  const selectFile = async (file) => {
    if (!validateFile(file)) {
      return;
    }

    const token = localStorage.getItem("talentVueToken");

    if (!token) {
      setError("Your session has expired. Please login again.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setAnalysis(null);
      setProgress(0);

      const formData = new FormData();

      formData.append("resume", file);

      const { ok, data } = await apiFetch(
        "/api/resume/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!ok) {
        setError(
          data.message || "Resume upload failed."
        );
        return;
      }

      // Store selected file for preview
      setResumeFile(file);

      // Save backend response
      const metadata = {
        id: data.resume.id,
        fileName: data.resume.fileName,
        fileSize: data.resume.fileSize,
        fileType: data.resume.fileType,
        filePath: data.resume.filePath,
        uploadedAt: data.resume.uploadedAt,
        status: "uploaded",
        analysis: null,
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(metadata)
      );

      setSavedResume(metadata);
    } catch (error) {
      console.log("Resume upload error:", error);

      setError(
        "Unable to upload resume. Please make sure the backend is running."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    selectFile(file);

    event.target.value = "";
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const file = event.dataTransfer.files[0];

    selectFile(file);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setResumeFile(null);
    setPreviewURL("");
    setSavedResume(null);
    setAnalysis(null);
    setProgress(0);
    setError("");

    localStorage.removeItem(storageKey);
  };

  const handleAnalyze = async () => {
    if (!savedResume) {
      setError("Please upload your resume first.");
      return;
    }

    setError("");
    setAnalyzing(true);
    setProgress(15);

    try {
      const { ok, data } = await apiFetch(
        "/api/resume/analyze",
        { method: "POST" }
      );

      if (!ok) {
        setError(
          data?.message ||
            "AI resume analysis failed."
        );
        return;
      }

      const metadata = {
        ...savedResume,
        analyzedAt: new Date().toISOString(),
        status: "analyzed",
        analysis: data.analysis,
        analysisSource: "ai",
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(metadata)
      );

      setSavedResume(metadata);
      setAnalysis(data.analysis);
      setProgress(100);
    } catch {
      setError(
        "Unable to reach the AI service. Please make sure the backend is running."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const sizeInKB = bytes / 1024;

    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }

    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  };

  const displayedFileName =
    resumeFile?.name ||
    savedResume?.fileName ||
    "";

  const displayedFileType =
    resumeFile?.type ||
    savedResume?.fileType ||
    "";

  const displayedFormat = getFileFormat(
    displayedFileName,
    displayedFileType
  );

  const isWordFormat =
    displayedFormat === "DOC" ||
    displayedFormat === "DOCX";

  const formatBadgeClass = isWordFormat
    ? "bg-blue-100 text-blue-600"
    : "bg-red-100 text-red-600";

  return (
    <div>
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Resume Intelligence
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Upload Your Resume
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload your latest resume so TalentVue can
            understand your skills, projects, internships,
            and experience for personalised interviews.
          </p>
        </div>

        <button
          onClick={() => setActivePage("Overview")}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          ← Dashboard
        </button>
      </section>

      {/* PROGRESS STEPS */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            number="1"
            title="Upload Resume"
            active={!analysis}
            completed={
              Boolean(resumeFile) ||
              Boolean(savedResume)
            }
          />

          <Step
            number="2"
            title="AI Analysis"
            active={Boolean(resumeFile) && !analysis}
            completed={Boolean(analysis)}
          />

          <Step
            number="3"
            title="Interview Ready"
            active={Boolean(analysis)}
            completed={Boolean(analysis)}
          />
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          {error}
        </div>
      )}

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">

        {/* LEFT */}
        <div className="space-y-6">

          {/* UPLOAD CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Resume File
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload your latest professional resume.
              </p>
            </div>

            {/* Upload Area */}
            {!resumeFile && !savedResume && (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-6 flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40"
                }`}
                onClick={handleBrowse}
              >
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-indigo-100 text-[11px] font-bold leading-4 text-indigo-600">
                  <span>PDF</span>
                  <span>DOC</span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-800">
                  Drop your resume here
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Drag and drop your PDF, DOC or DOCX
                  resume or click the button below to
                  browse your computer.
                </p>

                <button
                  type="button"
                  disabled={uploading}
                  className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading
                    ? "Uploading..."
                    : "Browse Resume"}
                </button>

                <p className="mt-4 text-xs text-slate-400">
                  PDF, DOC or DOCX • Maximum file size 10 MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* FILE SELECTED */}
            {(resumeFile || savedResume) && (
              <div className="mt-6">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    <div className={`flex h-14 min-w-14 items-center justify-center rounded-xl text-xs font-bold ${formatBadgeClass}`}>
                      {displayedFormat}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">
                        {displayedFileName}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          {formatFileSize(
                            resumeFile?.size ||
                              savedResume?.fileSize
                          )}
                        </span>

                        <span>{displayedFormat} Document</span>

                        <span className="font-semibold text-emerald-600">
                          ✓ Uploaded
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleBrowse}
                        disabled={uploading}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Change
                      </button>

                      <button
                        onClick={handleRemove}
                        disabled={uploading}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Status */}
                {uploading && (
                  <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3">
                    <p className="text-sm font-semibold text-indigo-700">
                      Uploading resume...
                    </p>

                    <p className="mt-1 text-xs text-indigo-600/70">
                      Please wait while your resume is being
                      uploaded to TalentVue.
                    </p>
                  </div>
                )}

                {/* Analyze */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Ready for resume analysis
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      TalentVue will identify skills,
                      projects, experience and interview
                      topics.
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || uploading}
                    className={`w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition sm:w-auto ${
                      analyzing || uploading
                        ? "cursor-not-allowed bg-indigo-400"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {analyzing
                      ? "Analyzing..."
                      : analysis
                      ? "Analyze Again"
                      : "Analyze Resume"}
                  </button>
                </div>

                {/* Progress */}
                {analyzing && (
                  <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">
                        Analyzing resume...
                      </span>

                      <span className="font-bold text-indigo-600">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      Extracting skills, projects and
                      interview topics...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DOCUMENT PREVIEW */}
          {previewURL && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Resume Preview
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {displayedFormat === "PDF"
                      ? "Preview your selected PDF before analysis."
                      : "Review your selected Word document before analysis."}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Ready
                </span>
              </div>

              {displayedFormat === "PDF" ? (
                <div className="h-[500px] bg-slate-100 sm:h-[650px]">
                  <iframe
                    src={previewURL}
                    title="Resume Preview"
                    className="h-full w-full"
                  ></iframe>
                </div>
              ) : (
                <WordDocumentPreview
                  fileName={displayedFileName}
                  format={displayedFormat}
                  sizeLabel={formatFileSize(
                    resumeFile?.size ||
                      savedResume?.fileSize
                  )}
                  fileUrl={previewURL}
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">

          {/* Tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">
              Resume Checklist
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              For better interview questions
            </p>

            <div className="mt-6 space-y-4">
              <ChecklistItem text="Use your latest resume" />

              <ChecklistItem text="Mention technical skills clearly" />

              <ChecklistItem text="Include project technologies" />

              <ChecklistItem text="Describe your contribution" />

              <ChecklistItem text="Add internships and experience" />

              <ChecklistItem text="Keep project links updated" />
            </div>
          </div>

          {/* Information */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              i
            </div>

            <h3 className="mt-4 font-bold text-indigo-950">
              Why do we need your resume?
            </h3>

            <p className="mt-3 text-sm leading-6 text-indigo-800/70">
              TalentVue uses your resume to create
              personalised technical, HR, project and
              follow-up questions instead of giving every
              candidate the same interview.
            </p>
          </div>
        </div>
      </section>

      {/* ANALYSIS RESULT */}
      {analysis && (
        <ResumeAnalysis
          analysis={analysis}
          setActivePage={setActivePage}
        />
      )}
    </div>
  );
}


// STEP COMPONENT

function Step({
  number,
  title,
  active,
  completed,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 min-w-10 items-center justify-center rounded-full text-sm font-bold ${
          completed
            ? "bg-emerald-100 text-emerald-600"
            : active
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {completed ? "✓" : number}
      </div>

      <div>
        <p
          className={`text-sm font-semibold ${
            active || completed
              ? "text-slate-800"
              : "text-slate-400"
          }`}
        >
          {title}
        </p>

        <p className="text-xs text-slate-400">
          Step {number}
        </p>
      </div>
    </div>
  );
}


// CHECKLIST COMPONENT

function ChecklistItem({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
        ✓
      </div>

      <p className="text-sm leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}


// WORD DOCUMENT PREVIEW COMPONENT

function WordDocumentPreview({
  fileName,
  format,
  sizeLabel,
  fileUrl,
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center bg-slate-50 px-6 py-10 text-center sm:min-h-[420px]">
      <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-600">
        {format}
      </div>

      <h3 className="mt-5 max-w-full truncate text-base font-bold text-slate-800">
        {fileName}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {format} Document • {sizeLabel}
      </p>

      <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
        Word documents can't be rendered inline in the
        browser. Open the file to review the full document
        before running the analysis.
      </p>

      <a
        href={fileUrl}
        download={fileName}
        className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700"
      >
        Open document
      </a>
    </div>
  );
}


// ANALYSIS COMPONENT

function ResumeAnalysis({
  analysis,
  setActivePage,
}) {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Analysis Complete
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Resume Intelligence Report
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">
                Resume Score
              </p>

              <p className="text-2xl font-bold text-indigo-600">
                {analysis.score}/100
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600">
              {analysis.score}%
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">

          {/* Role */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Detected Profile
            </p>

            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {analysis.profileType}
            </h3>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">

            {/* Skills */}
            <div>
              <h3 className="font-bold text-slate-800">
                Detected Skills
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h3 className="font-bold text-slate-800">
                Detected Projects
              </h3>

              <div className="mt-4 space-y-2">
                {analysis.projects.map(
                  (project, index) => (
                    <div
                      key={project}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                        {index + 1}
                      </span>

                      <p className="text-sm font-medium text-slate-700">
                        {project}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Strength / Improvements */}
          <div className="mt-7 grid gap-5 md:grid-cols-2">

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <h3 className="font-bold text-emerald-800">
                Resume Strengths
              </h3>

              <div className="mt-4 space-y-3">
                {analysis.strengths.map(
                  (strength) => (
                    <div
                      key={strength}
                      className="flex gap-2 text-sm leading-6 text-emerald-700"
                    >
                      <span>✓</span>

                      <span>{strength}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-800">
                Suggested Improvements
              </h3>

              <div className="mt-4 space-y-3">
                {analysis.improvements.map(
                  (improvement) => (
                    <div
                      key={improvement}
                      className="flex gap-2 text-sm leading-6 text-amber-700"
                    >
                      <span>→</span>

                      <span>{improvement}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Next */}
          <div className="glass-dark mt-7 flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-white">
                Resume is interview-ready
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Next, add project evidence to prepare
                deeper project-defence questions.
              </p>
            </div>

            <button
              onClick={() =>
                setActivePage("Projects")
              }
              className="glass-button w-full rounded-xl px-5 py-3 text-sm font-semibold text-white sm:w-auto"
            >
              Add Project →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResumeUpload;