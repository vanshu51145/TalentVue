function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                T
              </div>

              <h2 className="text-xl font-bold text-white">
                TalentVue
                <span className="text-indigo-400"> AI</span>
              </h2>
            </div>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
              AI-powered interview preparation that helps students practise,
              explain their projects, defend their skills, and improve their
              interview performance.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-sm font-bold text-slate-400 transition hover:border-indigo-500 hover:text-indigo-400"
              >
                G
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-sm font-bold text-slate-400 transition hover:border-indigo-500 hover:text-indigo-400"
              >
                in
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-sm font-bold text-slate-400 transition hover:border-indigo-500 hover:text-indigo-400"
              >
                @
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white">
              Platform
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <a href="#home" className="hover:text-indigo-400">
                Home
              </a>

              <a href="#features" className="hover:text-indigo-400">
                Features
              </a>

              <a href="#how-it-works" className="hover:text-indigo-400">
                How It Works
              </a>

              <a href="#difference" className="hover:text-indigo-400">
                Project Defence
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white">
              Resources
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <a href="#start" className="hover:text-indigo-400">
                Mock Interview
              </a>

              <a href="#start" className="hover:text-indigo-400">
                Resume Analysis
              </a>

              <a href="#start" className="hover:text-indigo-400">
                Interview Report
              </a>

              <a href="#start" className="hover:text-indigo-400">
                Help
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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