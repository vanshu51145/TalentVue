import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function PreInterviewCheck({
  user,
  setActivePage,
}) {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [setup, setSetup] = useState(null);

  const [online, setOnline] = useState(
    navigator.onLine
  );

  const [micStatus, setMicStatus] =
    useState("idle");

  const [micLevel, setMicLevel] =
    useState(0);

  const [
    microphonePermission,
    setMicrophonePermission,
  ] = useState(false);

  const [
    microphoneName,
    setMicrophoneName,
  ] = useState("");

  const [
    soundDetected,
    setSoundDetected,
  ] = useState(false);

  const [
    isMicTesting,
    setIsMicTesting,
  ] = useState(false);

  const [
    speakerStatus,
    setSpeakerStatus,
  ] = useState("idle");

  const [
    speakerPlayed,
    setSpeakerPlayed,
  ] = useState(false);

  const [
    speakerConfirmed,
    setSpeakerConfirmed,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const pendingKey =
    `talentVuePendingInterview_${user?.id}`;

  const deviceCheckKey =
    `talentVueDeviceCheck_${user?.id}`;

  // ------------------------------------------------
  // BROWSER CHECKS
  // ------------------------------------------------

  const browserChecks = useMemo(() => {
    return {
      microphoneAPI: Boolean(
        navigator.mediaDevices &&
          navigator.mediaDevices
            .getUserMedia
      ),

      mediaRecorder:
        typeof MediaRecorder !==
        "undefined",

      audioContext: Boolean(
        window.AudioContext ||
          window.webkitAudioContext
      ),

      secureContext:
        window.isSecureContext,
    };
  }, []);

  const browserReady =
    browserChecks.microphoneAPI &&
    browserChecks.mediaRecorder &&
    browserChecks.audioContext &&
    browserChecks.secureContext;

  // ------------------------------------------------
  // LOAD PENDING INTERVIEW
  // ------------------------------------------------

  useEffect(() => {
    if (!user?.id) return;

    const savedSetup =
      localStorage.getItem(
        pendingKey
      );

    if (!savedSetup) {
      setError(
        "Interview setup was not found. Please configure your interview first."
      );

      return;
    }

    try {
      const parsedSetup =
        JSON.parse(savedSetup);

      setSetup(parsedSetup);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load interview setup."
      );
    }
  }, [user?.id, pendingKey]);

  // ------------------------------------------------
  // INTERNET STATUS
  // ------------------------------------------------

  useEffect(() => {
    const handleOnline = () =>
      setOnline(true);

    const handleOffline = () =>
      setOnline(false);

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  // ------------------------------------------------
  // STOP MICROPHONE
  // ------------------------------------------------

  const stopMicrophone = useCallback(
    async (preserveStatus = true) => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !==
          "closed"
      ) {
        try {
          await audioContextRef.current.close();
        } catch (error) {
          console.error(error);
        }

        audioContextRef.current =
          null;
      }

      analyserRef.current = null;

      setIsMicTesting(false);

      setMicLevel(0);

      if (
        preserveStatus &&
        microphonePermission
      ) {
        setMicStatus("ready");
      }
    },
    [microphonePermission]
  );

  // ------------------------------------------------
  // CLEANUP
  // ------------------------------------------------

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !==
          "closed"
      ) {
        audioContextRef.current
          .close()
          .catch(() => {});
      }
    };
  }, []);

  // ------------------------------------------------
  // MICROPHONE TEST
  // ------------------------------------------------

  const startMicrophoneTest =
    async () => {
      setError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        setMicStatus("error");

        setError(
          "Your browser does not support microphone access."
        );

        return;
      }

      try {
        await stopMicrophone(false);

        setMicStatus("requesting");

        setSoundDetected(false);

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            }
          );

        streamRef.current =
          stream;

        const audioTrack =
          stream.getAudioTracks()[0];

        if (!audioTrack) {
          throw new Error(
            "No microphone track found."
          );
        }

        setMicrophoneName(
          audioTrack.label ||
            "Default Microphone"
        );

        setMicrophonePermission(
          true
        );

        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            "Web Audio API is not supported."
          );
        }

        const audioContext =
          new AudioContextClass();

        audioContextRef.current =
          audioContext;

        if (
          audioContext.state ===
          "suspended"
        ) {
          await audioContext.resume();
        }

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 256;

        analyser.smoothingTimeConstant =
          0.75;

        source.connect(analyser);

        analyserRef.current =
          analyser;

        const dataArray =
          new Uint8Array(
            analyser.fftSize
          );

        setMicStatus("listening");

        setIsMicTesting(true);

        const updateMicLevel = () => {
          if (
            !analyserRef.current
          ) {
            return;
          }

          analyserRef.current.getByteTimeDomainData(
            dataArray
          );

          let sumSquares = 0;

          for (
            let i = 0;
            i < dataArray.length;
            i++
          ) {
            const value =
              (dataArray[i] -
                128) /
              128;

            sumSquares +=
              value * value;
          }

          const rms =
            Math.sqrt(
              sumSquares /
                dataArray.length
            );

          const level =
            Math.min(
              100,
              Math.round(
                rms * 300
              )
            );

          setMicLevel(level);

          if (level > 3) {
            setSoundDetected(
              true
            );
          }

          animationFrameRef.current =
            requestAnimationFrame(
              updateMicLevel
            );
        };

        updateMicLevel();
      } catch (error) {
        console.error(error);

        setIsMicTesting(false);

        setMicrophonePermission(
          false
        );

        setMicLevel(0);

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          setMicStatus("denied");

          setError(
            "Microphone permission was denied. Please allow microphone access from your browser settings."
          );
        } else if (
          error?.name ===
          "NotFoundError"
        ) {
          setMicStatus("error");

          setError(
            "No microphone was found on this device."
          );
        } else if (
          error?.name ===
          "NotReadableError"
        ) {
          setMicStatus("error");

          setError(
            "Your microphone may be in use by another application."
          );
        } else {
          setMicStatus("error");

          setError(
            "Unable to test the microphone."
          );
        }
      }
    };

  const handleStopMic = async () => {
    await stopMicrophone(true);

    setMicStatus(
      microphonePermission
        ? "ready"
        : "idle"
    );
  };

  // ------------------------------------------------
  // SPEAKER TEST
  // ------------------------------------------------

  const testSpeaker = async () => {
    setError("");

    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        setError(
          "Speaker test is not supported in this browser."
        );

        return;
      }

      setSpeakerStatus(
        "playing"
      );

      setSpeakerPlayed(false);

      setSpeakerConfirmed(false);

      const context =
        new AudioContextClass();

      if (
        context.state ===
        "suspended"
      ) {
        await context.resume();
      }

      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      oscillator.type = "sine";

      oscillator.frequency.value =
        523.25;

      oscillator.connect(gain);

      gain.connect(
        context.destination
      );

      const now =
        context.currentTime;

      gain.gain.setValueAtTime(
        0.0001,
        now
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        now + 0.05
      );

      gain.gain.setValueAtTime(
        0.12,
        now + 0.45
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.7
      );

      oscillator.start(now);

      oscillator.stop(
        now + 0.75
      );

      oscillator.onended =
        async () => {
          try {
            await context.close();
          } catch {
            // ignore
          }

          setSpeakerStatus(
            "played"
          );

          setSpeakerPlayed(
            true
          );
        };
    } catch (error) {
      console.error(error);

      setSpeakerStatus("error");

      setError(
        "Unable to play the speaker test sound."
      );
    }
  };

  // ------------------------------------------------
  // READINESS
  // ------------------------------------------------

  const microphoneReady =
    microphonePermission;

  const canStartInterview =
    browserReady &&
    microphoneReady &&
    speakerConfirmed;

  const completedChecks = [
    browserReady,
    microphoneReady,
    speakerConfirmed,
  ].filter(Boolean).length;

  const readinessPercentage =
    Math.round(
      (completedChecks / 3) *
        100
    );

  // ------------------------------------------------
  // START INTERVIEW
  // ------------------------------------------------

  const handleStartInterview =
    async () => {
      if (!browserReady) {
        setError(
          "Your browser is not fully ready for the interview."
        );

        return;
      }

      if (!microphoneReady) {
        setError(
          "Please test your microphone before starting."
        );

        return;
      }

      if (!speakerConfirmed) {
        setError(
          "Please complete the speaker test before starting."
        );

        return;
      }

      await stopMicrophone(true);

      const deviceCheck = {
        microphone: "ready",

        microphoneName,

        soundDetected,

        speaker: "ready",

        browserReady,

        secureContext:
          browserChecks.secureContext,

        online,

        checkedAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        deviceCheckKey,
        JSON.stringify(
          deviceCheck
        )
      );

      setActivePage(
        "Interview Room"
      );
    };

  // ------------------------------------------------
  // SETUP NOT FOUND
  // ------------------------------------------------

  if (!setup) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-500">
            !
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Interview Setup Required
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "Configure your interview before running the device check."}
          </p>

          <button
            onClick={() =>
              setActivePage(
                "Start Interview"
              )
            }
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Configure Interview
          </button>

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
            System Check
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Prepare Your Interview Environment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Check your microphone,
            speakers and browser before
            entering the interview room.
          </p>

        </div>

        <button
          onClick={() => {
            stopMicrophone(
              true
            );

            setActivePage(
              "Start Interview"
            );
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          ← Interview Setup
        </button>

      </section>

      {/* INTERVIEW SUMMARY */}
      <section className="mt-8 rounded-2xl bg-slate-950 p-5 sm:p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
              Upcoming Interview
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              {setup.targetRole}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {setup.interviewType}
              {" • "}
              {setup.difficulty}
              {" • "}
              {setup.questionCount}
              {" questions • "}
              {setup.duration}
              {" minutes"}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Device Readiness
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {readinessPercentage}%
            </p>

          </div>

        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{
              width:
                `${readinessPercentage}%`,
            }}
          ></div>

        </div>

      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          {error}
        </div>
      )}

      {/* MAIN */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">

        {/* LEFT */}
        <div className="space-y-6">

          {/* MICROPHONE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold ${
                    microphonePermission
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  MIC
                </div>

                <div>

                  <h2 className="font-bold text-slate-900">
                    Microphone Test
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Speak normally and
                    check whether the input
                    meter responds.
                  </p>

                </div>

              </div>

              <StatusBadge
                status={
                  microphonePermission
                    ? "success"
                    : micStatus ===
                        "denied" ||
                      micStatus ===
                        "error"
                    ? "error"
                    : micStatus ===
                      "requesting"
                    ? "warning"
                    : "neutral"
                }
                text={
                  microphonePermission
                    ? "Ready"
                    : micStatus ===
                      "requesting"
                    ? "Requesting..."
                    : micStatus ===
                      "denied"
                    ? "Permission Denied"
                    : "Not Tested"
                }
              />

            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">

              {microphoneName && (
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                  <span className="text-xs text-slate-400">
                    Input Device
                  </span>

                  <span className="max-w-md truncate text-xs font-semibold text-slate-700">
                    {microphoneName}
                  </span>

                </div>
              )}

              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold text-slate-600">
                  Microphone Input Level
                </p>

                <p className="text-xs font-bold text-indigo-600">
                  {micLevel}%
                </p>

              </div>

              <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200">

                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    micLevel > 65
                      ? "bg-red-500"
                      : micLevel > 25
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
                  }`}
                  style={{
                    width:
                      `${micLevel}%`,
                  }}
                ></div>

              </div>

              <div className="mt-4 flex items-center gap-2">

                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    soundDetected
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                ></div>

                <p
                  className={`text-xs font-medium ${
                    soundDetected
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {soundDetected
                    ? "Voice input detected"
                    : "Speak into your microphone to verify input"}
                </p>

              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                {!isMicTesting ? (
                  <button
                    onClick={
                      startMicrophoneTest
                    }
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {microphonePermission
                      ? "Test Again"
                      : "Test Microphone"}
                  </button>
                ) : (
                  <button
                    onClick={
                      handleStopMic
                    }
                    className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    Stop Microphone Test
                  </button>
                )}

              </div>

            </div>

          </div>

          {/* SPEAKER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold ${
                    speakerConfirmed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  SPK
                </div>

                <div>

                  <h2 className="font-bold text-slate-900">
                    Speaker Test
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Play a short sound to
                    make sure your device
                    audio is working.
                  </p>

                </div>

              </div>

              <StatusBadge
                status={
                  speakerConfirmed
                    ? "success"
                    : speakerStatus ===
                      "playing"
                    ? "warning"
                    : "neutral"
                }
                text={
                  speakerConfirmed
                    ? "Ready"
                    : speakerStatus ===
                      "playing"
                    ? "Playing..."
                    : "Not Tested"
                }
              />

            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">

              <p className="text-sm text-slate-600">
                Click the button below.
                You should hear a short
                test tone.
              </p>

              <button
                onClick={
                  testSpeaker
                }
                disabled={
                  speakerStatus ===
                  "playing"
                }
                className="mt-5 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {speakerStatus ===
                "playing"
                  ? "Playing Test Sound..."
                  : "▶ Play Test Sound"}
              </button>

              {speakerPlayed && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

                  <p className="text-sm font-semibold text-slate-700">
                    Did you hear the test
                    sound?
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    <button
                      onClick={() => {
                        setSpeakerConfirmed(
                          true
                        );

                        setSpeakerStatus(
                          "ready"
                        );
                      }}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      ✓ Yes, I Heard It
                    </button>

                    <button
                      onClick={() => {
                        setSpeakerConfirmed(
                          false
                        );

                        testSpeaker();
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Test Again
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <aside className="space-y-6 xl:sticky xl:top-[95px] xl:self-start">

          {/* SYSTEM STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              System Status
            </p>

            <h2 className="mt-2 font-bold text-slate-900">
              Browser Readiness
            </h2>

            <div className="mt-6 space-y-3">

              <CheckRow
                label="Microphone API"
                ready={
                  browserChecks.microphoneAPI
                }
              />

              <CheckRow
                label="Media Recorder"
                ready={
                  browserChecks.mediaRecorder
                }
              />

              <CheckRow
                label="Web Audio"
                ready={
                  browserChecks.audioContext
                }
              />

              <CheckRow
                label="Secure Connection"
                ready={
                  browserChecks.secureContext
                }
              />

              <CheckRow
                label="Internet Connection"
                ready={online}
                optional
              />

            </div>

          </div>

          {/* ENVIRONMENT CHECK */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Before You Begin
            </p>

            <div className="mt-5 space-y-4">

              <PreparationItem
                text="Find a quiet environment"
              />

              <PreparationItem
                text="Keep your microphone close"
              />

              <PreparationItem
                text="Avoid refreshing the page"
              />

              <PreparationItem
                text="Answer naturally and clearly"
              />

              <PreparationItem
                text="Keep enough time available"
              />

            </div>

          </div>

          {/* READY CARD */}
          <div className="rounded-2xl bg-slate-950 p-5 sm:p-6">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
              Interview Readiness
            </p>

            <div className="mt-5 space-y-3">

              <ReadyRow
                label="Browser"
                complete={
                  browserReady
                }
              />

              <ReadyRow
                label="Microphone"
                complete={
                  microphoneReady
                }
              />

              <ReadyRow
                label="Speaker"
                complete={
                  speakerConfirmed
                }
              />

            </div>

            {!soundDetected &&
              microphoneReady && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">

                  <p className="text-xs leading-5 text-amber-300">
                    Microphone permission
                    is available, but voice
                    input has not yet been
                    detected. Test it again
                    if necessary.
                  </p>

                </div>
              )}

            <button
              onClick={
                handleStartInterview
              }
              disabled={
                !canStartInterview
              }
              className={`mt-6 w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                canStartInterview
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "cursor-not-allowed bg-slate-800 text-slate-500"
              }`}
            >
              {canStartInterview
                ? "I'm Ready – Start Interview →"
                : "Complete Device Check"}
            </button>

          </div>

        </aside>

      </section>

    </div>
  );
}


// ----------------------------------------
// STATUS BADGE
// ----------------------------------------

function StatusBadge({
  status,
  text,
}) {
  const styles = {
    success:
      "bg-emerald-50 text-emerald-600",

    warning:
      "bg-amber-50 text-amber-600",

    error:
      "bg-red-50 text-red-500",

    neutral:
      "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[status] ||
        styles.neutral
      }`}
    >
      {text}
    </span>
  );
}


// ----------------------------------------
// CHECK ROW
// ----------------------------------------

function CheckRow({
  label,
  ready,
  optional = false,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">

      <div>

        <p className="text-sm font-medium text-slate-600">
          {label}
        </p>

        {optional && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            Recommended
          </p>
        )}

      </div>

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          ready
            ? "bg-emerald-100 text-emerald-600"
            : "bg-red-100 text-red-500"
        }`}
      >
        {ready ? "✓" : "!"}
      </div>

    </div>
  );
}


// ----------------------------------------
// PREPARATION ITEM
// ----------------------------------------

function PreparationItem({
  text,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
        ✓
      </div>

      <p className="text-sm leading-5 text-indigo-900/70">
        {text}
      </p>

    </div>
  );
}


// ----------------------------------------
// READY ROW
// ----------------------------------------

function ReadyRow({
  label,
  complete,
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span
        className={`text-xs font-semibold ${
          complete
            ? "text-emerald-400"
            : "text-slate-600"
        }`}
      >
        {complete
          ? "Ready ✓"
          : "Pending"}
      </span>

    </div>
  );
}

export default PreInterviewCheck;