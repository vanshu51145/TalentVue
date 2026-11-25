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
      label: "Dashboard",
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
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-200/50 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      <aside
        className={`glass-dark fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[73px] items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="glass-button flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white">
              T
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                TalentVue
                <span className="text-indigo-500"> AI</span>
              </h1>

              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                Interview Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="glass-card flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 lg:hidden"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
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
                      ? "glass-button text-white"
                      : "text-slate-600 hover:bg-white/70 hover:text-indigo-600"
                  }`}
                >
                  <span
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-white/20"
                        : "glass-card"
                    }`}
                  >
                    {item.symbol}
                  </span>

                  {item.label || item.name}
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Practice
          </p>

          <button
            onClick={() =>
              handleMenuClick("Start Interview")
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-white/70 hover:text-indigo-600"
          >
            <span className="glass-card flex h-9 min-w-9 items-center justify-center rounded-lg text-xs font-bold">
              +
            </span>

            Start Interview
          </button>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="glass-button flex h-10 min-w-10 items-center justify-center rounded-full font-bold text-white">
                {firstLetter}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
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
