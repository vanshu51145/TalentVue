import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            T
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              TalentVue
              <span className="text-indigo-600"> AI</span>
            </h1>

            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:block">
              Interview Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            Home
          </Link>

          <a
            href="/#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            How It Works
          </a>

          <a
            href="/#features"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            Features
          </a>

          <a
            href="/#difference"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            Why TalentVue
          </a>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 lg:hidden"
        >
          <span
            className={`h-0.5 w-5 bg-slate-700 transition ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          ></span>

          <span
            className={`h-0.5 w-5 bg-slate-700 transition ${
              menuOpen ? "opacity-0" : ""
            }`}
          ></span>

          <span
            className={`h-0.5 w-5 bg-slate-700 transition ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-2">

            <Link
              to="/"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-indigo-50"
            >
              Home
            </Link>

            <a
              href="/#how-it-works"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-indigo-50"
            >
              How It Works
            </a>

            <a
              href="/#features"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-indigo-50"
            >
              Features
            </a>

            <a
              href="/#difference"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-indigo-50"
            >
              Why TalentVue
            </a>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">

              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white"
              >
                Get Started
              </Link>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;