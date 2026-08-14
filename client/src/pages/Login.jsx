import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const successMessage = location.state?.message;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const email = formData.email.trim().toLowerCase();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    const savedUsers =
      JSON.parse(localStorage.getItem("talentVueUsers")) || [];

    const matchedUser = savedUsers.find(
      (user) =>
        user.email === email &&
        user.password === formData.password
    );

    if (!matchedUser) {
      setError("Invalid email or password.");
      return;
    }

    const loggedInUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
    };

    localStorage.setItem(
      "talentVueCurrentUser",
      JSON.stringify(loggedInUser)
    );

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

      {/* LEFT */}
      <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">

        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"></div>

        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl"></div>

        <Link to="/" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            T
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">
              TalentVue
              <span className="text-indigo-400"> AI</span>
            </h1>

            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Interview Intelligence
            </p>
          </div>
        </Link>

        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Welcome back
          </p>

          <h2 className="mt-5 text-4xl font-bold leading-tight text-white xl:text-5xl">
            Your next interview can be
            <span className="text-indigo-400"> better than your last.</span>
          </h2>

          <p className="mt-6 leading-7 text-slate-400">
            Continue practising technical questions, defending your projects,
            and improving your interview performance.
          </p>

          {/* Mini Card */}
          <div className="mt-9 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Interview Tip
            </p>

            <p className="mt-3 leading-7 text-slate-300">
              Don't only explain what you built. Be prepared to explain why
              you selected each technology and what you would improve.
            </p>
          </div>
        </div>

        <p className="relative text-sm text-slate-600">
          Practice • Prove • Improve
        </p>
      </section>

      {/* RIGHT */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link
            to="/"
            className="mb-10 flex items-center justify-center gap-3 lg:hidden"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              T
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              TalentVue
              <span className="text-indigo-600"> AI</span>
            </h1>
          </Link>

          <div>
            <p className="text-sm font-semibold text-indigo-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Login to your account
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Continue your interview preparation.
            </p>
          </div>

          {/* Success */}
          {successMessage && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-indigo-600"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
              />

              Remember me
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
            >
              Login
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create Account
            </Link>
          </p>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              ← Back to home
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Login;