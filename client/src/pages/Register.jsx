import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

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

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.length < 3) {
      setError("Name must contain at least 3 characters.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const savedUsers =
      JSON.parse(localStorage.getItem("talentVueUsers")) || [];

    const userExists = savedUsers.some(
      (user) => user.email === email
    );

    if (userExists) {
      setError("An account with this email already exists.");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: formData.password,
    };

    const updatedUsers = [...savedUsers, newUser];

    localStorage.setItem(
      "talentVueUsers",
      JSON.stringify(updatedUsers)
    );

    navigate("/login", {
      state: {
        message: "Account created successfully. Please login.",
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

      {/* LEFT SECTION */}
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
            Start your preparation
          </p>

          <h2 className="mt-5 text-4xl font-bold leading-tight text-white xl:text-5xl">
            Build skills that you can actually
            <span className="text-indigo-400"> defend.</span>
          </h2>

          <p className="mt-6 leading-7 text-slate-400">
            Create your profile and prepare for technical, HR, project-based,
            and adaptive interviews built around your real experience.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                ✓
              </span>

              Resume-based questions
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                ✓
              </span>

              Project defence preparation
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                ✓
              </span>

              Personalised performance feedback
            </div>
          </div>
        </div>

        <p className="relative text-sm text-slate-600">
          Practice • Prove • Improve
        </p>
      </section>

      {/* RIGHT SECTION */}
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
              CREATE ACCOUNT
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Start your interview journey
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Create your TalentVue account and start practising smarter.
            </p>
          </div>

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

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>

              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Enter password again"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-indigo-600"
              />

              <p className="text-xs leading-5 text-slate-500">
                I agree to the Terms of Service and Privacy Policy.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
            >
              Create Account
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Login
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

export default Register;