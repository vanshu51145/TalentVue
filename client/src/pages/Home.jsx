import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function Home() {
  const steps = [
    {
      number: "01",
      symbol: "CV",
      title: "Upload Resume",
      description:
        "Add your resume and project details to create your personalised interview profile.",
    },
    {
      number: "02",
      symbol: "GO",
      title: "Choose Your Goal",
      description:
        "Select your target role, interview type, difficulty level, and duration.",
    },
    {
      number: "03",
      symbol: "MIC",
      title: "Attend Interview",
      description:
        "Answer technical, HR, project-based, and adaptive follow-up questions.",
    },
    {
      number: "04",
      symbol: "UP",
      title: "Improve",
      description:
        "Review scores, weak areas, feedback, and personalised recommendations.",
    },
  ];

  const features = [
    {
      symbol: "CV",
      title: "Resume-Based Interview",
      description:
        "Generate questions from the skills, projects, internships, and technologies mentioned in your resume.",
    },
    {
      symbol: "DEV",
      title: "Project Defence",
      description:
        "Practise explaining project architecture, technical decisions, limitations, and your personal contribution.",
    },
    {
      symbol: "MIC",
      title: "Voice Interview",
      description:
        "Answer questions naturally with your microphone in a realistic interview environment.",
    },
    {
      symbol: "AI",
      title: "Adaptive Follow-Ups",
      description:
        "The next question changes depending on the depth and quality of your previous response.",
    },
    {
      symbol: "✓",
      title: "Evidence Based",
      description:
        "Connect your resume claims with project evidence instead of practising only generic questions.",
    },
    {
      symbol: "↻",
      title: "Recovery Training",
      description:
        "Learn to handle difficult questions, corrections, uncertainty, interruptions, and interview pressure.",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <Navbar />

      <main>

        {/* HERO SECTION */}
        <section
          id="home"
          className="glass-nav relative scroll-mt-20 overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl"></div>

          <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-pink-300/30 blur-3xl"></div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 md:py-24 lg:min-h-[calc(100vh-73px)] lg:grid-cols-2 lg:px-8">
            
            {/* HERO LEFT */}
            <div>
              <div className="glass-card inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 sm:text-sm">
                AI-Powered Interview Preparation
              </div>

              <h1 className="mt-7 text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
                Don't just say you
                <span className="text-indigo-500"> have skills.</span>
                <br />
                Prove them.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                TalentVue AI prepares you for real interviews using your
                resume, projects, technical knowledge, project evidence, and
                personalised follow-up questions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="glass-button inline-flex items-center justify-center rounded-xl px-6 py-3.5 font-semibold text-white transition"
                >
                  Start Free Interview
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  to="/how-it-works"
                  className="glass-card inline-flex items-center justify-center rounded-xl px-6 py-3.5 font-semibold text-slate-700 transition hover:text-indigo-600"
                >
                  How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Resume Based
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  Project Focused
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  AI Feedback
                </div>
              </div>
            </div>

            {/* HERO RIGHT */}
            <div className="mx-auto w-full max-w-xl">
              <div className="glass-card rounded-[28px] p-4 sm:p-5">
                
                {/* Interview Card Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="glass-button flex h-11 w-11 items-center justify-center rounded-xl font-bold text-white">
                      AI
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                        Technical Interview
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Full Stack Developer
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    ● Live
                  </div>
                </div>

                {/* Question */}
                <div className="py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Question 4 of 10
                    </span>

                    <span className="glass-card rounded-lg px-3 py-1.5 text-xs text-slate-600">
                      01:24
                    </span>
                  </div>

                  <div className="glass-card mt-5 rounded-2xl p-5">
                    <p className="text-sm leading-7 text-slate-700 sm:text-base">
                      You mentioned using Local Storage in your project. Why did
                      you choose it, and what limitations would you face if the
                      application scaled to thousands of users?
                    </p>
                  </div>

                  {/* Recording */}
                  <div className="glass-card mt-5 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="glass-button flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">
                        MIC
                      </div>

                      <div>
                        <p className="text-sm font-medium text-indigo-600">
                          Recording your answer
                        </p>

                        <p className="text-xs text-slate-500">
                          Speak clearly and naturally
                        </p>
                      </div>
                    </div>

                    {/* Waveform */}
                    <div className="mt-6 flex h-14 items-center justify-center gap-1.5">
                      {[
                        22, 42, 30, 60, 36, 70, 28, 54, 38, 66, 32, 50, 26,
                        58, 40, 68, 30, 48,
                      ].map((height, index) => (
                        <span
                          key={index}
                          className="w-1 rounded-full bg-indigo-400"
                          style={{
                            height: `${height}%`,
                          }}
                        ></span>
                      ))}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="glass-card rounded-xl p-3 sm:p-4">
                      <p className="text-[10px] text-slate-500 sm:text-xs">
                        Technical
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        84%
                      </p>
                    </div>

                    <div className="glass-card rounded-xl p-3 sm:p-4">
                      <p className="text-[10px] text-slate-500 sm:text-xs">
                        Delivery
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        76%
                      </p>
                    </div>

                    <div className="glass-card rounded-xl p-3 sm:p-4">
                      <p className="text-[10px] text-slate-500 sm:text-xs">
                        Evidence
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        91%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="glass-nav mt-8 border-y">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-10 text-center sm:px-6 lg:grid-cols-4 lg:px-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                4+
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Interview Modes
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                360°
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Performance Feedback
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                AI
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Adaptive Questions
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                24/7
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Interview Practice
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                How It Works
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Your personalised interview journey
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Start with your own resume and build a realistic interview
                around your skills, projects, and target role.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="glass-card group rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-indigo-50 px-2 text-xs font-bold text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                      {step.symbol}
                    </div>

                    <span className="text-sm font-bold text-slate-300">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="glass-nav scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                Core Features
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                More than a normal mock interview
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                TalentVue is designed to improve how you explain, defend, and
                demonstrate the skills mentioned in your resume.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card group rounded-2xl p-6 transition duration-300 hover:-translate-y-1"
                >
                  <div className="glass-card flex h-12 min-w-12 w-fit items-center justify-center rounded-xl px-3 text-xs font-bold text-indigo-600">
                    {feature.symbol}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIFFERENCE SECTION */}
        <section
          id="difference"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="glass-card grid items-center gap-12 rounded-[28px] p-7 sm:p-10 lg:grid-cols-2 lg:p-14">
              
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                  What Makes TalentVue Different
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Your project becomes part of the interview.
                </h2>

                <p className="mt-5 leading-7 text-slate-600">
                  Instead of asking only generic interview questions,
                  TalentVue focuses on your project decisions, technologies,
                  contributions, challenges, and limitations.
                </p>

                <div className="mt-7 space-y-3">
                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600">✓</span>
                    <p className="text-sm text-slate-600">
                      Resume claim-based questions
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600">✓</span>
                    <p className="text-sm text-slate-600">
                      Project contribution defence
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600">✓</span>
                    <p className="text-sm text-slate-600">
                      Adaptive technical follow-ups
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600">✓</span>
                    <p className="text-sm text-slate-600">
                      Weak-topic improvement suggestions
                    </p>
                  </div>
                </div>
              </div>

              {/* Example */}
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Project Defence
                  </p>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Evidence Based
                  </span>
                </div>

                <div className="glass-card mt-5 rounded-xl p-5">
                  <p className="text-sm leading-7 text-slate-700 sm:text-base">
                    You mentioned MongoDB in your project. Why did you choose a
                    document database instead of SQL, and what would change if
                    your application required complex relationships?
                  </p>
                </div>

                <div className="glass-card mt-5 rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    Interview Focus
                  </p>

                  <p className="mt-2 text-sm text-indigo-900">
                    Technology choice • Database design • Scalability • Project
                    understanding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          id="start"
          className="scroll-mt-20 pb-20 sm:pb-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="glass-dark relative overflow-hidden rounded-[28px] px-6 py-14 text-center sm:px-10 sm:py-16">
              
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#D3C9E8]/25 blur-3xl"></div>

              <div className="relative mx-auto max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Start Preparing
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Ready to test your interview skills?
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Practise your projects, improve your answers, and prepare for
                  challenging interview questions before the real interview.
                </p>

              <Link
                to="/register"
                className="glass-button mt-8 inline-block rounded-xl px-7 py-3.5 font-semibold text-white transition"
              >
                Create Free Account →
              </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;