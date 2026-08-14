import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-7xl font-bold text-indigo-600">
        404
      </h1>

      <p className="mt-3 text-xl text-gray-600">
        Page not found
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-white"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;