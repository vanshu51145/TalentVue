function Footer() {
  return (
    <footer className="glass-nav mt-10 border-t">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="glass-button flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white">
                T
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                TalentVue
                <span className="text-indigo-500"> AI</span>
              </h2>
            </div>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              AI-powered interview preparation that helps students practise,
              explain their projects, defend their skills, and improve their
              interview performance.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="glass-card flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-slate-500 transition hover:text-indigo-600"
              >
                G
              </a>

              <a
                href="#"
                className="glass-card flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-slate-500 transition hover:text-indigo-600"
              >
                in
              </a>

              <a
                href="#"
                className="glass-card flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-slate-500 transition hover:text-indigo-600"
              >
                @
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Platform
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              <a href="#home" className="transition hover:text-indigo-600">
                Home
              </a>

              <a href="#features" className="transition hover:text-indigo-600">
                Features
              </a>

              <a href="#how-it-works" className="transition hover:text-indigo-600">
                How It Works
              </a>

              <a href="#difference" className="transition hover:text-indigo-600">
                Project Defence
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Resources
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              <a href="#start" className="transition hover:text-indigo-600">
                Mock Interview
              </a>

              <a href="#start" className="transition hover:text-indigo-600">
                Resume Analysis
              </a>

              <a href="#start" className="transition hover:text-indigo-600">
                Interview Report
              </a>

              <a href="#start" className="transition hover:text-indigo-600">
                Help
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 TalentVue AI. All rights reserved.
          </p>

          <p>
            Practice • Prove • Improve
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
