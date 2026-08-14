function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activePage,
  setActivePage,
  user,
  handleLogout,
}) {
  const menuItems = [
    {
      name: "Overview",
      symbol: "⌂",
    },
    {
      name: "Resume",
      symbol: "CV",
    },
    {
      name: "Projects",
      symbol: "P",
    },
    {
      name: "Interviews",
      symbol: "I",
    },
    {
      name: "Reports",
      symbol: "R",
    },
  ];

  const handleMenuClick = (name) => {
    setActivePage(name);
    setSidebarOpen(false);
  };

  const firstLetter =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[73px] items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              T
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                TalentVue
                <span className="text-indigo-400"> AI</span>
              </h1>

              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                Interview Intelligence
              </p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-xl text-slate-400 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Main Menu
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleMenuClick(item.name)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-white/10"
                        : "bg-slate-900"
                    }`}
                  >
                    {item.symbol}
                  </span>

                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Practice Section */}
          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Practice
          </p>

          <button
            onClick={() =>
              handleMenuClick("Start Interview")
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold">
              +
            </span>

            Start Interview
          </button>
        </div>

        {/* User Section */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-2xl bg-slate-900 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                {firstLetter}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;