import { useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../utils/api";

const REQUEST_TIMEOUT_MS = 15000;

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setEmail(event.target.value);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = email.trim().toLowerCase();

    // Frontend validation
    if (!value) {
      setError("Please enter your email address.");
      return;
    }

    if (!value.includes("@") || !value.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Bound the request so a slow/stalled backend (e.g. SMTP delivery) can
    // never leave the button stuck on "Sending..." with no feedback.
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { ok, data } = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email: value },
        signal: controller.signal,
      });

      if (!ok) {
        setError(
          data?.message || "Unable to send the reset link. Please try again."
        );
        return;
      }

      setSuccess(
        data?.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
      setEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);

      setError(
        timedOut
          ? "The request timed out while sending the reset email. Please try again in a moment."
          : "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

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
            Get back to
            <span className="text-indigo-500"> preparing.</span>
          </h2>

          <p className="mt-6 leading-7 text-slate-600">
            Enter the email linked to your account and we will send you a secure
            link to reset your password and continue your interview preparation.
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

          <div>
            <p className="text-sm font-semibold text-indigo-600">
              FORGOT PASSWORD
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Reset your password
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your account email and we will send you a reset link.
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
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
            noValidate
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
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full rounded-xl px-5 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

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

export default ForgotPassword;
