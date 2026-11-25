import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function BackButton({
  label = "Back",
  fallback = "/dashboard",
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const hasInAppHistory =
      location.key && location.key !== "default";

    if (hasInAppHistory) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={`Go ${label.toLowerCase()}`}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700 ${className}`}
    >
      <ArrowLeft
        className="h-4 w-4"
        aria-hidden="true"
      />

      {label}
    </button>
  );
}

export default BackButton;
