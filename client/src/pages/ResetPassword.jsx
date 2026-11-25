import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { apiFetch } from "../utils/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Frontend validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { ok, data } = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        auth: false,
        body: {
          email,
          token,
          newPassword: formData.newPassword,
        },
      });

      if (!ok) {
        setError(
          data?.message ||
            "Unable to reset password. The link may be invalid or expired."
        );
        return;
      }

      // Password reset successfully
      navigate("/login", {
        state: {
          message:
            "Password reset successfully. Please login with your new password.",
        },
      });
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const hasResetParams = Boolean(token && email);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">

      {/* LEFT SECTION */}
      <section className="glass-nav relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">

        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl"></div>

        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-pink-300/30 blur-3xl"></div>

        <Link to="/" className="relative flex items-center gap-3">
          <div className="glass-button flex h-11 w-11 items-center justify-center rounded-xl font-bold text-white">
            T
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              TalentVue
              <span className="text-indigo-500"> AI</span>
            </h1>

            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Interview Intelligence
            </p>
          </div>
        </Link>

        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Account recovery
          </p>

          <h2 className="mt-5 text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
            Set a new
            <span className="text-indigo-500"> password.</span>
          </h2>

          <p className="mt-6 leading-7 text-slate-600">
            Choose a strong password you have not used before to keep your
            TalentVue account secure.
          </p>
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
            <div className="glass-button flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white">
              T
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              TalentVue
              <span className="text-indigo-600"> AI</span>
            </h1>
          </Link>

          {hasResetParams ? (
            <>
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  RESET PASSWORD
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Choose a new password
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Create a new password for{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button w-full rounded-xl px-5 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                INVALID LINK
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                This reset link is invalid
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                The password reset link is missing or incomplete. Please request
                a new link to continue.
              </p>

              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                The reset link must include a valid token and email address.
              </div>

              <Link
                to="/forgot-password"
                className="glass-button mt-6 block w-full rounded-xl px-5 py-3.5 text-center font-semibold text-white transition"
              >
                Request a New Link
              </Link>
            </div>
          )}

          <p className="mt-7 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Back to Login
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

export default ResetPassword;
