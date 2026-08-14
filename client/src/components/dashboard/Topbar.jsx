function Topbar({
  setSidebarOpen,
  user,
}) {
  const firstLetter =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          onClick={() =>
            setSidebarOpen(true)
          }
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 lg:hidden"
        >
          <span className="h-0.5 w-5 bg-slate-700"></span>
          <span className="h-0.5 w-5 bg-slate-700"></span>
          <span className="h-0.5 w-5 bg-slate-700"></span>
        </button>

        <div>
          <p className="text-xs text-slate-400">
            Welcome back
          </p>

          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            {user?.name || "User"}
          </h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        
        {/* Notification */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:bg-slate-50">
          ♢

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User */}
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
            {firstLetter}
          </div>

          <div className="hidden md:block">
            <p className="max-w-[130px] truncate text-xs font-semibold text-slate-700">
              {user?.name}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;