import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  LogOut,
} from "lucide-react";

function Topbar({
  setSidebarOpen,
  user,
  handleLogout,
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuContainerRef = useRef(null);

  const triggerRef = useRef(null);

  const firstLetter =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(
          event.target
        )
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  const handleTriggerKeyDown = (event) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      setMenuOpen(true);

      requestAnimationFrame(() => {
        const firstItem =
          menuContainerRef.current?.querySelector(
            '[role="menuitem"]'
          );

        firstItem?.focus();
      });
    }
  };

  const handleLogoutClick = () => {
    setMenuOpen(false);
    handleLogout?.();
  };

  return (
    <header className="glass-nav sticky top-0 z-30 flex h-[73px] items-center justify-between px-4 sm:px-6 lg:px-8">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          onClick={() =>
            setSidebarOpen(true)
          }
          className="glass-card flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl lg:hidden"
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
        <button className="glass-card relative flex h-10 w-10 items-center justify-center rounded-xl text-lg transition hover:text-indigo-600">
          ♢

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User + Profile dropdown */}
        <div
          ref={menuContainerRef}
          className="relative"
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            onKeyDown={handleTriggerKeyDown}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="profile-menu"
            aria-label="Open profile menu"
            className={`glass-card hidden items-center gap-3 rounded-xl px-3 py-2 transition hover:border-indigo-200 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4fc] sm:flex ${
              menuOpen ? "ring-2 ring-indigo-200" : ""
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
              {firstLetter}
            </div>

            <div className="hidden md:block">
              <p className="max-w-[130px] truncate text-xs font-semibold text-slate-700">
                {user?.name}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {menuOpen && (
            <div
              id="profile-menu"
              role="menu"
              aria-label="Profile menu"
              className="glass-card absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-2 shadow-xl"
            >
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {firstLetter}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.name || "User"}
                  </p>

                  {user?.email && (
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="my-1 h-px bg-slate-200/80"></div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
              >
                <LogOut
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
