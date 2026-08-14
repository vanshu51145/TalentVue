import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function InterviewRoom({ user, setActivePage }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioURLRef = useRef("");
  const discardRecordingRef = useRef(false);
  const answersRef = useRef([]);
  const finishingRef = useRef(false);

  const [setup, setSetup] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [audioURL, setAudioURL] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);

  const [microphoneStatus, setMicrophoneStatus] =
    useState("idle");

  const [error, setError] = useState("");

  const [sessionSeconds, setSessionSeconds] =
    useState(0);

  const [interviewStarted, setInterviewStarted] =
    useState(false);

  const pendingKey =
    `talentVuePendingInterview_${user?.id}`;

  const sessionKey =
    `talentVueActiveInterview_${user?.id}`;

  /*
    Keep latest answers available inside
    timer callbacks.
  */
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  /*
    Stop microphone stream.
  */
  const stopMediaStream = useCallback(() => {
    if (!streamRef.current) return;

    streamRef.current
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    streamRef.current = null;
  }, []);

  /*
    Remove current audio preview.
  */
  const clearAudio = useCallback(() => {
    if (audioURLRef.current) {
      URL.revokeObjectURL(
        audioURLRef.current
      );

      audioURLRef.current = "";
    }

    setAudioURL("");
    setAudioBlob(null);
    setRecordingSeconds(0);
  }, []);

  /*
    Load interview setup.
  */
  useEffect(() => {
    if (!user?.id) return;

    finishingRef.current = false;

    const savedSetup =
      localStorage.getItem(pendingKey);

    if (!savedSetup) {
      setError(
        "Interview setup was not found. Please configure your interview first."
      );

      return;
    }

    try {
      const parsedSetup =
        JSON.parse(savedSetup);

      const generatedQuestions =
        generateQuestions(parsedSetup);

      setSetup(parsedSetup);

      setQuestions(
        generatedQuestions
      );

      setCurrentQuestionIndex(0);

      setAnswerText("");

      setAnswers([]);
      answersRef.current = [];

      setAudioURL("");
      setAudioBlob(null);

      setRecordingSeconds(0);

      setMicrophoneStatus("idle");

      setError("");

      setSessionSeconds(
        Number(
          parsedSetup.duration || 20
        ) * 60
      );

      setInterviewStarted(true);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load interview setup."
      );
    }
  }, [user?.id, pendingKey]);

  /*
    Save completed interview.
  */
  const finishInterview = useCallback(
    (finalAnswers) => {
      if (finishingRef.current) {
        return;
      }

      finishingRef.current = true;

      const completedAnswers =
        finalAnswers ??
        answersRef.current;

      /*
        Stop active microphone recording.
      */
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        discardRecordingRef.current =
          true;

        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error(error);
        }
      }

      stopMediaStream();

      setIsRecording(false);

      setInterviewStarted(false);

      const completedInterview = {
        sessionId:
          setup?.sessionId ||
          Date.now(),

        setup,

        answers: completedAnswers,

        totalQuestions:
          questions.length,

        answeredQuestions:
          completedAnswers.filter(
            (answer) =>
              !answer.skipped
          ).length,

        skippedQuestions:
          completedAnswers.filter(
            (answer) =>
              answer.skipped
          ).length,

        completedAt:
          new Date().toISOString(),

        status: "completed",
      };

      /*
        Latest completed interview
      */
      localStorage.setItem(
        `talentVueCompletedInterview_${user.id}`,
        JSON.stringify(
          completedInterview
        )
      );

      /*
        Save interview in history.
      */
      const historyKey =
        `talentVueInterviewHistory_${user.id}`;

      let previousHistory = [];

      try {
        previousHistory =
          JSON.parse(
            localStorage.getItem(
              historyKey
            )
          ) || [];

        if (
          !Array.isArray(
            previousHistory
          )
        ) {
          previousHistory = [];
        }
      } catch {
        previousHistory = [];
      }

      const alreadyExists =
        previousHistory.some(
          (item) =>
            String(
              item.sessionId
            ) ===
            String(
              completedInterview.sessionId
            )
        );

      if (!alreadyExists) {
        const updatedHistory = [
          ...previousHistory,
          completedInterview,
        ];

        localStorage.setItem(
          historyKey,
          JSON.stringify(
            updatedHistory
          )
        );
      }

      /*
        Remove active interview session.
      */
      localStorage.removeItem(
        sessionKey
      );

      /*
        Remove pending interview.
        User must configure again for
        another interview.
      */
      localStorage.removeItem(
        pendingKey
      );

      clearAudio();

      setActivePage(
        "Interview Result"
      );
    },
    [
      setup,
      questions.length,
      user?.id,
      sessionKey,
      pendingKey,
      setActivePage,
      stopMediaStream,
      clearAudio,
    ]
  );

  /*
    Overall interview timer.
  */
  useEffect(() => {
    if (!interviewStarted) return;

    const timer = setInterval(() => {
      setSessionSeconds(
        (previous) => {
          if (previous <= 1) {
            clearInterval(timer);

            setTimeout(() => {
              finishInterview(
                answersRef.current
              );
            }, 0);

            return 0;
          }

          return previous - 1;
        }
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    interviewStarted,
    finishInterview,
  ]);

  /*
    Voice recording timer.
  */
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setRecordingSeconds(
        (previous) =>
          previous + 1
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [isRecording]);

  /*
    Cleanup when component closes.
  */
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        discardRecordingRef.current =
          true;

        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error(error);
        }
      }

      stopMediaStream();

      if (
        audioURLRef.current
      ) {
        URL.revokeObjectURL(
          audioURLRef.current
        );

        audioURLRef.current = "";
      }
    };
  }, [stopMediaStream]);

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  /*
    Interview progress percentage.
  */
  const progress = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    return Math.round(
      ((currentQuestionIndex + 1) /
        questions.length) *
        100
    );
  }, [
    currentQuestionIndex,
    questions.length,
  ]);

  /*
    Start microphone recording.
  */
  const startRecording =
    async () => {
      setError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        setError(
          "Microphone recording is not supported in this browser."
        );

        return;
      }

      if (
        typeof MediaRecorder ===
        "undefined"
      ) {
        setError(
          "Audio recording is not supported in this browser."
        );

        return;
      }

      if (isRecording) {
        return;
      }

      try {
        /*
          Remove previous recording
          before recording again.
        */
        clearAudio();

        setMicrophoneStatus(
          "requesting"
        );

        discardRecordingRef.current =
          false;

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        streamRef.current = stream;

        let recorder;

        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  "audio/webm;codecs=opus",
              }
            );
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {
          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  "audio/webm",
              }
            );
        } else {
          recorder =
            new MediaRecorder(
              stream
            );
        }

        mediaRecorderRef.current =
          recorder;

        chunksRef.current = [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              chunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onerror =
          (event) => {
            console.error(
              "Recorder error:",
              event
            );

            setError(
              "An error occurred while recording audio."
            );
          };

        recorder.onstop = () => {
          /*
            Skip/delete/timeout can
            intentionally discard audio.
          */
          if (
            discardRecordingRef.current
          ) {
            discardRecordingRef.current =
              false;

            chunksRef.current = [];

            stopMediaStream();

            return;
          }

          if (
            chunksRef.current.length ===
            0
          ) {
            stopMediaStream();
            return;
          }

          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  "audio/webm",
              }
            );

          if (
            audioURLRef.current
          ) {
            URL.revokeObjectURL(
              audioURLRef.current
            );
          }

          const url =
            URL.createObjectURL(
              blob
            );

          audioURLRef.current = url;

          setAudioBlob(blob);
          setAudioURL(url);

          setMicrophoneStatus(
            "ready"
          );

          chunksRef.current = [];

          stopMediaStream();
        };

        recorder.start();

        setRecordingSeconds(0);

        setIsRecording(true);

        setMicrophoneStatus(
          "recording"
        );
      } catch (error) {
        console.error(error);

        stopMediaStream();

        setIsRecording(false);

        setMicrophoneStatus(
          "denied"
        );

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          setError(
            "Microphone permission was denied. Please allow microphone access in your browser settings."
          );
        } else if (
          error?.name ===
          "NotFoundError"
        ) {
          setError(
            "No microphone was found on this device."
          );
        } else {
          setError(
            "The microphone could not be accessed."
          );
        }
      }
    };

  /*
    Internal recording stop function.
  */
  const stopCurrentRecording = (
    discard = false
  ) => {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }

    discardRecordingRef.current =
      discard;

    try {
      recorder.stop();
    } catch (error) {
      console.error(error);
    }

    setIsRecording(false);

    setMicrophoneStatus(
      discard
        ? "idle"
        : "ready"
    );
  };

  /*
    Stop button.
  */
  const stopRecording = () => {
    stopCurrentRecording(false);
  };

  /*
    Delete current recording.
  */
  const deleteRecording = () => {
    if (isRecording) {
      stopCurrentRecording(true);
    }

    clearAudio();

    setMicrophoneStatus(
      "idle"
    );
  };

  /*
    Save interview progress.
  */
  const saveInterviewProgress = (
    updatedAnswers,
    index
  ) => {
    const sessionData = {
      sessionId:
        setup?.sessionId ||
        Date.now(),

      setup,

      currentQuestionIndex:
        index,

      answers:
        updatedAnswers,

      status: "in_progress",

      updatedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      sessionKey,
      JSON.stringify(
        sessionData
      )
    );
  };

  /*
    Go to next question.
  */
  const moveToNextQuestion = (
    updatedAnswers
  ) => {
    clearAudio();

    setMicrophoneStatus(
      "idle"
    );

    setAnswerText("");

    setError("");

    if (
      currentQuestionIndex <
      questions.length - 1
    ) {
      setCurrentQuestionIndex(
        (previous) =>
          previous + 1
      );

      return;
    }

    finishInterview(
      updatedAnswers
    );
  };

  /*
    Submit answer.
  */
  const submitAnswer = () => {
    setError("");

    if (!currentQuestion) {
      setError(
        "Question could not be loaded."
      );

      return;
    }

    if (isRecording) {
      setError(
        "Please stop the recording before submitting your answer."
      );

      return;
    }

    if (
      !answerText.trim() &&
      !audioBlob
    ) {
      setError(
        "Please type an answer or record your voice before submitting."
      );

      return;
    }

    const answerData = {
      questionId:
        currentQuestion.id,

      question:
        currentQuestion.question,

      category:
        currentQuestion.category,

      answer:
        answerText.trim(),

      hasAudio:
        Boolean(audioBlob),

      recordingDuration:
        recordingSeconds,

      answeredAt:
        new Date().toISOString(),

      skipped: false,
    };

    const updatedAnswers = [
      ...answers,
      answerData,
    ];

    setAnswers(
      updatedAnswers
    );

    answersRef.current =
      updatedAnswers;

    saveInterviewProgress(
      updatedAnswers,
      currentQuestionIndex
    );

    moveToNextQuestion(
      updatedAnswers
    );
  };

  /*
    Skip current question.
  */
  const skipQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    /*
      Discard current recording
      completely if active.
    */
    if (isRecording) {
      stopCurrentRecording(true);
    }

    clearAudio();

    const skippedAnswer = {
      questionId:
        currentQuestion.id,

      question:
        currentQuestion.question,

      category:
        currentQuestion.category,

      answer: "",

      hasAudio: false,

      recordingDuration: 0,

      answeredAt:
        new Date().toISOString(),

      skipped: true,
    };

    const updatedAnswers = [
      ...answers,
      skippedAnswer,
    ];

    setAnswers(
      updatedAnswers
    );

    answersRef.current =
      updatedAnswers;

    saveInterviewProgress(
      updatedAnswers,
      currentQuestionIndex
    );

    moveToNextQuestion(
      updatedAnswers
    );
  };

  /*
    Exit interview manually.
  */
  const handleExit = () => {
    const shouldExit =
      window.confirm(
        "Exit this interview? Your current progress may be incomplete."
      );

    if (!shouldExit) {
      return;
    }

    if (isRecording) {
      stopCurrentRecording(true);
    }

    stopMediaStream();

    clearAudio();

    setInterviewStarted(
      false
    );

    setActivePage(
      "Overview"
    );
  };

  /*
    Setup unavailable.
  */
  if (!setup) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 font-bold text-red-500">
            !
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Interview unavailable
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "Please configure your interview first."}
          </p>

          <button
            onClick={() =>
              setActivePage(
                "Start Interview"
              )
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Configure Interview
          </button>

        </div>
      </div>
    );
  }

  /*
    Prevent blank screen while
    questions are being prepared.
  */
  if (
    !questions.length ||
    !currentQuestion
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>

          <p className="mt-4 text-sm text-slate-500">
            Preparing interview...
          </p>
        </div>

      </div>
    );
  }

  return (
    <div>

      {/* TOP INTERVIEW BAR */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT */}
          <div>
            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                ● LIVE INTERVIEW
              </span>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                {setup.interviewType}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {setup.difficulty}
              </span>

            </div>

            <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
              {setup.targetRole}
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              {setup.experienceLevel}
              {" • "}
              {questions.length} questions
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-950 px-4 py-3 text-center">

              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Time Left
              </p>

              <p className="mt-1 font-mono text-lg font-bold text-white">
                {formatTime(
                  sessionSeconds
                )}
              </p>

            </div>

            <button
              onClick={handleExit}
              className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              Exit
            </button>

          </div>
        </div>

        {/* PROGRESS */}
        <div className="border-t border-slate-100 px-5 py-4 sm:px-6">

          <div className="flex items-center justify-between text-xs">

            <span className="font-semibold text-slate-600">
              Question{" "}
              {currentQuestionIndex + 1}
              {" "}of{" "}
              {questions.length}
            </span>

            <span className="font-bold text-indigo-600">
              {progress}%
            </span>

          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>
        </div>

      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          {error}
        </div>
      )}

      {/* MAIN INTERVIEW */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

        {/* LEFT CONTENT */}
        <div className="space-y-6">

          {/* QUESTION CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                {currentQuestion.category}
              </span>

              <span className="text-xs font-semibold text-slate-400">
                Take a moment to think
              </span>

            </div>

            <p className="mt-6 text-lg font-semibold leading-8 text-slate-900 sm:text-xl">
              {currentQuestion.question}
            </p>

            {currentQuestion.hint && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Answer Focus
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {currentQuestion.hint}
                </p>

              </div>
            )}

          </div>

          {/* MICROPHONE CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-slate-900">
                  Voice Answer
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Record your answer using your microphone.
                </p>
              </div>

              <MicrophoneBadge
                status={
                  microphoneStatus
                }
              />

            </div>

            {/* RECORDER */}
            <div
              className={`mt-6 rounded-2xl border p-5 transition sm:p-6 ${
                isRecording
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >

              <div className="flex flex-col items-center text-center">

                <button
                  type="button"
                  onClick={
                    isRecording
                      ? stopRecording
                      : startRecording
                  }
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg transition ${
                    isRecording
                      ? "animate-pulse bg-red-500 hover:bg-red-600"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isRecording
                    ? "STOP"
                    : "MIC"}
                </button>

                <h3 className="mt-4 font-bold text-slate-800">
                  {isRecording
                    ? "Recording..."
                    : audioURL
                    ? "Recording complete"
                    : "Start recording"}
                </h3>

                <p className="mt-2 font-mono text-xl font-bold text-slate-700">
                  {formatTime(
                    recordingSeconds
                  )}
                </p>

                {isRecording && (
                  <Waveform />
                )}

                {!isRecording &&
                  !audioURL && (
                    <p className="mt-3 max-w-sm text-xs leading-5 text-slate-400">
                      Click the microphone button and allow
                      microphone permission in your browser.
                    </p>
                  )}

              </div>

              {/* AUDIO PLAYBACK */}
              {audioURL &&
                !isRecording && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">

                    <p className="mb-3 text-xs font-semibold text-slate-500">
                      Recorded Answer
                    </p>

                    <audio
                      controls
                      src={audioURL}
                      className="w-full"
                    ></audio>

                    <div className="mt-3 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={
                          startRecording
                        }
                        className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        Record Again
                      </button>

                      <button
                        type="button"
                        onClick={
                          deleteRecording
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Delete Recording
                      </button>

                    </div>

                  </div>
                )}

            </div>

          </div>

          {/* TEXT ANSWER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="font-bold text-slate-900">
                  Answer Notes
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Optional during voice practice.
                </p>
              </div>

              <span className="text-xs text-slate-400">
                {answerText.length} characters
              </span>

            </div>

            <textarea
              value={answerText}
              onChange={(event) =>
                setAnswerText(
                  event.target.value
                )
              }
              rows="7"
              placeholder="Type your answer here, or use this area for key points..."
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            ></textarea>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

              <button
                onClick={skipQuestion}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Skip Question
              </button>

              <button
                onClick={submitAnswer}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {currentQuestionIndex ===
                questions.length - 1
                  ? "Submit & Finish"
                  : "Submit & Next →"}
              </button>

            </div>

          </div>

        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6 xl:sticky xl:top-[95px] xl:self-start">

          {/* SESSION DETAILS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Session Details
            </p>

            <div className="mt-5 space-y-4">

              <InfoRow
                label="Role"
                value={
                  setup.targetRole
                }
              />

              <InfoRow
                label="Type"
                value={
                  setup.interviewType
                }
              />

              <InfoRow
                label="Difficulty"
                value={
                  setup.difficulty
                }
              />

              <InfoRow
                label="Experience"
                value={
                  setup.experienceLevel
                }
              />

              <InfoRow
                label="Answered"
                value={`${answers.filter(
                  (answer) =>
                    !answer.skipped
                ).length}/${questions.length}`}
              />

              <InfoRow
                label="Skipped"
                value={
                  answers.filter(
                    (answer) =>
                      answer.skipped
                  ).length
                }
              />

            </div>

          </div>

          {/* PROJECT EVIDENCE */}
          {setup.useProjectEvidence &&
            setup.selectedProjectTitle && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Project Evidence
                </p>

                <h3 className="mt-3 font-bold text-indigo-950">
                  {
                    setup.selectedProjectTitle
                  }
                </h3>

                <p className="mt-2 text-xs leading-5 text-indigo-800/70">
                  Interview questions may reference this
                  project's technologies, contribution and
                  challenges.
                </p>

              </div>
            )}

          {/* ANSWER GUIDE */}
          <div className="rounded-2xl bg-slate-950 p-5">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
              Answer Guide
            </p>

            <div className="mt-5 space-y-4">

              <GuideItem
                number="1"
                text="Answer the question directly"
              />

              <GuideItem
                number="2"
                text="Explain your reasoning"
              />

              <GuideItem
                number="3"
                text="Give a practical example"
              />

              <GuideItem
                number="4"
                text="Mention results or limitations"
              />

            </div>

          </div>

          {/* RECORDING TIP */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">

            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Recording Tip
            </p>

            <p className="mt-3 text-sm leading-6 text-amber-800">
              Keep the microphone close enough for clear
              audio, but avoid speaking directly into it.
              Speak naturally and avoid answering too fast.
            </p>

          </div>

        </aside>

      </section>

    </div>
  );
}


/*
  Generate mock interview questions.
*/
function generateQuestions(setup) {
  const project =
    setup.selectedProjectTitle ||
    "your project";

  const role =
    setup.targetRole ||
    "Software Developer";

  const commonQuestions = [
    {
      category:
        "Introduction",

      question:
        "Tell me about yourself and briefly explain why you are interested in this role.",

      hint:
        "Keep it professional: education, relevant skills, projects and career goal.",
    },

    {
      category:
        "Technical",

      question:
        `What technical skills make you suitable for a ${role} position?`,

      hint:
        "Mention technologies you can actually explain and use.",
    },

    {
      category:
        "Technical",

      question:
        "Explain one technical concept that you have used practically in a project.",

      hint:
        "Explain the concept, where you used it, and why it was useful.",
    },

    {
      category:
        "Problem Solving",

      question:
        "Describe a difficult bug or technical issue you faced and how you solved it.",

      hint:
        "Explain problem → investigation → solution → result.",
    },

    {
      category:
        "Project Defence",

      question:
        `Explain ${project} as if I have never seen the project before.`,

      hint:
        "Cover problem, solution, technologies and your contribution.",
    },

    {
      category:
        "Project Defence",

      question:
        `What was your exact contribution to ${project}, and which part would be difficult for another developer to replace?`,

      hint:
        "Be specific about pages, features, logic, APIs or database work.",
    },

    {
      category:
        "Project Defence",

      question:
        `If ${project} suddenly had thousands of users, what technical changes would you make?`,

      hint:
        "Think about database, backend, performance, security and scalability.",
    },

    {
      category:
        "HR",

      question:
        "What is one weakness you are currently working to improve?",

      hint:
        "Mention a genuine but manageable weakness and the action you are taking.",
    },

    {
      category:
        "Behavioural",

      question:
        "Tell me about a situation where something did not go according to plan.",

      hint:
        "Use Situation, Task, Action and Result.",
    },

    {
      category:
        "Closing",

      question:
        "Why should we consider you for this opportunity?",

      hint:
        "Connect your skills, learning ability and relevant project experience to the role.",
    },
  ];

  let filteredQuestions;

  if (
    setup.interviewType ===
    "Technical"
  ) {
    filteredQuestions =
      commonQuestions.filter(
        (question) =>
          [
            "Introduction",
            "Technical",
            "Problem Solving",
            "Closing",
          ].includes(
            question.category
          )
      );
  } else if (
    setup.interviewType ===
    "HR"
  ) {
    filteredQuestions =
      commonQuestions.filter(
        (question) =>
          [
            "Introduction",
            "HR",
            "Behavioural",
            "Closing",
          ].includes(
            question.category
          )
      );
  } else if (
    setup.interviewType ===
    "Project Defence"
  ) {
    filteredQuestions =
      commonQuestions.filter(
        (question) =>
          [
            "Introduction",
            "Project Defence",
            "Problem Solving",
            "Closing",
          ].includes(
            question.category
          )
      );
  } else {
    filteredQuestions =
      commonQuestions;
  }

  const requestedCount =
    Number(
      setup.questionCount
    ) || 10;

  const expandedQuestions = [];

  while (
    expandedQuestions.length <
    requestedCount
  ) {
    filteredQuestions.forEach(
      (question) => {
        if (
          expandedQuestions.length <
          requestedCount
        ) {
          expandedQuestions.push({
            ...question,

            id:
              expandedQuestions.length +
              1,
          });
        }
      }
    );
  }

  return expandedQuestions;
}


/*
  Format timer.
*/
function formatTime(seconds) {
  const safeSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(
    2,
    "0"
  )}`;
}


/*
  Microphone status badge.
*/
function MicrophoneBadge({
  status,
}) {
  const statusData = {
    idle: {
      text: "Not Started",

      style:
        "bg-slate-100 text-slate-500",
    },

    requesting: {
      text: "Requesting...",

      style:
        "bg-amber-50 text-amber-600",
    },

    recording: {
      text: "Recording",

      style:
        "bg-red-50 text-red-500",
    },

    ready: {
      text: "Recorded",

      style:
        "bg-emerald-50 text-emerald-600",
    },

    denied: {
      text:
        "Permission Denied",

      style:
        "bg-red-50 text-red-500",
    },
  };

  const current =
    statusData[status] ||
    statusData.idle;

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${current.style}`}
    >
      {current.text}
    </span>
  );
}


/*
  Fake recording waveform.
*/
function Waveform() {
  const heights = [
    25,
    50,
    35,
    70,
    45,
    80,
    30,
    60,
    40,
    75,
    35,
    55,
    28,
    68,
    40,
    72,
    30,
    50,
  ];

  return (
    <div className="mt-6 flex h-14 items-center justify-center gap-1.5">

      {heights.map(
        (
          height,
          index
        ) => (
          <span
            key={index}
            className="w-1 animate-pulse rounded-full bg-red-400"
            style={{
              height:
                `${height}%`,
            }}
          ></span>
        )
      )}

    </div>
  );
}


/*
  Session info row.
*/
function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3">

      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-xs font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}


/*
  Answer guide item.
*/
function GuideItem({
  number,
  text,
}) {
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

export default InterviewRoom;