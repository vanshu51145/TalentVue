import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import { DashboardChild } from "./pages/dashboardRoutes";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<DashboardChild page="overview" />}
        />

        <Route
          path="resume"
          element={<DashboardChild page="resume" />}
        />

        <Route
          path="projects"
          element={<DashboardChild page="projects" />}
        />

        <Route
          path="interviews"
          element={<DashboardChild page="interviews" />}
        />

        <Route
          path="reports"
          element={<DashboardChild page="reports" />}
        />

        <Route
          path="start-interview"
          element={
            <DashboardChild page="start-interview" />
          }
        />

        <Route
          path="device-check"
          element={
            <DashboardChild page="device-check" />
          }
        />

        <Route
          path="interview-room"
          element={
            <DashboardChild page="interview-room" />
          }
        />

        <Route
          path="interview-result"
          element={
            <DashboardChild page="interview-result" />
          }
        />

        <Route
          path="*"
          element={
            <DashboardChild page="coming-soon" />
          }
        />
      </Route>

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;
