import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const VOICE_RMS_START = 0.02;
const VOICE_RMS_RELEASE = 0.012;
const VOICE_SUSTAIN_MS = 400;

function PreInterviewCheck({
  user,
  setActivePage,
}) {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const voiceActivityStartRef = useRef(null);
  const voiceVerifiedRef = useRef(false);
  const trackListenersRef = useRef(null);
  const testRunIdRef = useRef(0);
  const isMountedRef = useRef(true);

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
    voiceVerified,
    setVoiceVerified,
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

  const releaseMicrophone = useCallback(() => {
    if (
      animationFrameRef.current
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    if (trackListenersRef.current) {
      trackListenersRef.current();

      trackListenersRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    const context =
      audioContextRef.current;

    audioContextRef.current = null;

    analyserRef.current = null;

    voiceActivityStartRef.current =
      null;

    setIsMicTesting(false);

    setMicLevel(0);

    return context;
  }, []);

  const stopMicrophone = useCallback(
    async (preserveStatus = true) => {
      const context =
        releaseMicrophone();

      if (
        context &&
        context.state !== "closed"
      ) {
        try {
          await context.close();
        } catch (error) {
          console.error(error);
        }
      }

      if (!preserveStatus) {
        voiceVerifiedRef.current = false;

        setVoiceVerified(false);

        setSoundDetected(false);
      } else if (voiceVerifiedRef.current) {
        setMicStatus("verified");
      }
    },
    [releaseMicrophone]
  );

  // ------------------------------------------------
  // CLEANUP
  // ------------------------------------------------

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      testRunIdRef.current += 1;

      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      if (trackListenersRef.current) {
        trackListenersRef.current();

        trackListenersRef.current = null;
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
        audioContextRef.current
          .close()
          .catch(() => {});

        audioContextRef.current =
          null;
      }
    };
  }, []);

  useEffect(() => {
    const mediaDevices =
      navigator.mediaDevices;

    if (
      !mediaDevices ||
      typeof mediaDevices.addEventListener !==
        "function"
    ) {
      return;
    }

    const handleDeviceChange = () => {
      if (
        !streamRef.current &&
        !voiceVerifiedRef.current
      ) {
        return;
      }

      voiceVerifiedRef.current = false;

      voiceActivityStartRef.current =
        null;

      setVoiceVerified(false);

      setSoundDetected(false);

      setMicrophonePermission(false);

      setMicrophoneName("");

      setMicStatus("idle");

      setError(
        "Audio device changed. Please test your microphone again."
      );

      stopMicrophone(false);
    };

    mediaDevices.addEventListener(
      "devicechange",
      handleDeviceChange
    );

    return () => {
      mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [stopMicrophone]);

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
        voiceVerifiedRef.current = false;

        setVoiceVerified(false);

        setMicrophonePermission(false);

        setMicrophoneName("");

        setSoundDetected(false);

        setMicStatus("error");

        setError(
          "Your browser does not support microphone access."
        );

        return;
      }

      const runId =
        testRunIdRef.current + 1;

      testRunIdRef.current = runId;

      try {
        const previousContext =
          releaseMicrophone();

        voiceVerifiedRef.current = false;

        voiceActivityStartRef.current =
          null;

        setVoiceVerified(false);

        setSoundDetected(false);

        setMicrophonePermission(
          false
        );

        setMicrophoneName("");

        setMicStatus("requesting");

        const streamPromise =
          navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        if (
          previousContext &&
          previousContext.state !==
            "closed"
        ) {
          previousContext
            .close()
            .catch(() => {});
        }

        const stream =
          await streamPromise;

        if (
          runId !== testRunIdRef.current ||
          !isMountedRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          return;
        }

        streamRef.current =
          stream;

        const audioTrack =
          stream.getAudioTracks()[0];

        if (
          !audioTrack ||
          audioTrack.readyState ===
            "ended" ||
          !audioTrack.enabled
        ) {
          throw new Error(
            "No usable microphone track found."
          );
        }

        if (audioTrack.muted) {
          throw new Error(
            "The microphone is muted or unavailable."
          );
        }

        setMicrophoneName(
          audioTrack.label ||
            "Default Microphone"
        );

        setMicrophonePermission(
          true
        );

        const invalidateMicrophone = (
          message
        ) => {
          if (
            runId !==
              testRunIdRef.current ||
            !isMountedRef.current
          ) {
            return;
          }

          voiceVerifiedRef.current = false;

          voiceActivityStartRef.current =
            null;

          setVoiceVerified(false);

          setSoundDetected(false);

          setMicrophonePermission(
            false
          );

          setMicrophoneName("");

          setMicStatus("error");

          setError(message);

          stopMicrophone(false);
        };

        const handleTrackEnded = () => {
          invalidateMicrophone(
            "Microphone disconnected. Please test it again."
          );
        };

        const handleTrackMute = () => {
          invalidateMicrophone(
            "Microphone is muted. Please unmute it and test again."
          );
        };

        audioTrack.addEventListener(
          "ended",
          handleTrackEnded
        );

        audioTrack.addEventListener(
          "mute",
          handleTrackMute
        );

        trackListenersRef.current =
          () => {
            audioTrack.removeEventListener(
              "ended",
              handleTrackEnded
            );

            audioTrack.removeEventListener(
              "mute",
              handleTrackMute
            );
          };

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

        if (
          runId !== testRunIdRef.current ||
          !isMountedRef.current
        ) {
          await audioContext
            .close()
            .catch(() => {});

          audioContextRef.current =
            null;

          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          streamRef.current = null;

          return;
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

          const now =
            performance.now();

          if (rms >= VOICE_RMS_START) {
            if (
              voiceActivityStartRef.current ===
              null
            ) {
              voiceActivityStartRef.current =
                now;
            } else if (
              !voiceVerifiedRef.current &&
              now -
                voiceActivityStartRef.current >=
                VOICE_SUSTAIN_MS
            ) {
              voiceVerifiedRef.current = true;

              setVoiceVerified(true);

              setSoundDetected(true);

              setMicStatus("verified");

              const completedContext =
                releaseMicrophone();

              if (
                completedContext &&
                completedContext.state !==
                  "closed"
              ) {
                completedContext
                  .close()
                  .catch(() => {});
              }

              return;
            }
          } else if (
            rms <= VOICE_RMS_RELEASE
          ) {
            voiceActivityStartRef.current =
              null;
          }

          animationFrameRef.current =
            requestAnimationFrame(
              updateMicLevel
            );
        };

        updateMicLevel();
      } catch (error) {
        if (
          runId !== testRunIdRef.current
        ) {
          return;
        }

        console.error(error);

        voiceVerifiedRef.current = false;

        voiceActivityStartRef.current =
          null;

        setIsMicTesting(false);

        setVoiceVerified(false);

        setSoundDetected(false);

        setMicrophonePermission(
          false
        );

        setMicrophoneName("");

        setMicLevel(0);

        if (trackListenersRef.current) {
          trackListenersRef.current();

          trackListenersRef.current = null;
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
          audioContextRef.current
            .close()
            .catch(() => {});

          audioContextRef.current =
            null;
        }

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          setMicStatus("denied");

          setError(
            "Microphone access is blocked. In Chrome, open Site Settings from the address bar, set Microphone to Allow, then reload this page and test again."
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
            error?.message ||
              "Unable to test the microphone."
          );
        }
      }
    };

  const handleStopMic = async () => {
    await stopMicrophone(true);

    setMicStatus(
      voiceVerifiedRef.current
        ? "verified"
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
    microphonePermission &&
    voiceVerified;

  const isMicRequesting =
    micStatus === "requesting";

  const canStartInterview =
    browserReady &&
    microphonePermission &&
    voiceVerified &&
    speakerConfirmed &&
    !isMicRequesting;

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

      if (isMicRequesting) {
        setError(
          "Please wait for the microphone test to finish."
        );

        return;
      }

      if (
        !microphonePermission ||
        !voiceVerified
      ) {
        setError(
          "Please test your microphone and speak until voice input is detected before starting."
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
        // Bind this check to the interview session it validated
        sessionId: setup?.sessionId,

        microphone: voiceVerified
          ? "ready"
          : "not-ready",

        microphoneVerified:
          voiceVerified,

        voiceVerified,

        voiceVerifiedAt:
          voiceVerified
            ? new Date().toISOString()
            : null,

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
      <section className="glass-dark mt-8 rounded-2xl p-5 sm:p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Upcoming Interview
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {setup.targetRole}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
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

          <div className="glass-card rounded-xl px-5 py-3">

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Device Readiness
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {readinessPercentage}%
            </p>

          </div>

        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#D3C9E8]/60">

          <div
            className="glass-button h-full rounded-full transition-all duration-500"
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
                    voiceVerified
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
                  voiceVerified
                    ? "success"
                    : micStatus ===
                          "denied" ||
                        micStatus ===
                          "error"
                      ? "error"
                      : micStatus ===
                            "requesting" ||
                          isMicTesting ||
                          microphonePermission
                        ? "warning"
                        : "neutral"
                }
                text={
                  voiceVerified
                    ? "Ready"
                    : micStatus ===
                        "requesting"
                      ? "Requesting..."
                      : micStatus ===
                          "denied"
                        ? "Permission Denied"
                        : isMicTesting
                          ? "Listening..."
                          : microphonePermission
                            ? "Not Verified"
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
                    voiceVerified
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                ></div>

                <p
                  className={`text-xs font-medium ${
                    voiceVerified
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {voiceVerified
                    ? "Voice detected! Microphone test completed successfully."
                    : "Please speak to test your microphone."}
                </p>

              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                {!isMicTesting ? (
                  <button
                    onClick={
                      startMicrophoneTest
                    }
                    disabled={
                      isMicRequesting
                    }
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isMicRequesting
                      ? "Requesting Microphone..."
                      : microphonePermission
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

              {micStatus === "denied" && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-xs font-semibold text-red-700">
                    Microphone permission is blocked
                  </p>

                  <p className="mt-2 text-xs leading-5 text-red-600">
                    In Chrome, click the site
                    settings icon in the address
                    bar (lock or tune icon), set
                    Microphone to Allow, then
                    reload this page and test
                    again. You can also open
                    Settings → Privacy and
                    security → Site settings →
                    Microphone.
                  </p>

                </div>
              )}

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
          <div className="glass-card rounded-2xl p-5 sm:p-6">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
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

            {!voiceVerified &&
              microphonePermission && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">

                  <p className="text-xs leading-5 text-amber-700">
                    Microphone permission
                    is available, but voice
                    input has not been
                    detected yet. Please
                    speak into your
                    microphone to continue.
                  </p>

                </div>
              )}

            <button
              onClick={
                handleStartInterview
              }
              disabled={
                !canStartInterview ||
                isMicRequesting
              }
              className={`mt-6 w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                canStartInterview
                  ? "glass-button text-white"
                  : "glass-card cursor-not-allowed text-slate-500"
              }`}
            >
              {isMicRequesting
                ? "Testing Microphone..."
                : canStartInterview
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

      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span
        className={`text-xs font-semibold ${
          complete
            ? "text-emerald-600"
            : "text-slate-500"
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