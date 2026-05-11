import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";

import SignupPage from "./pages/SignupPage";

import ProtectedRoute from "./components/ProtectedRoute";

import ProblemsPage from "./pages/ProblemsPage";

import ProblemWorkspace from "./pages/ProblemWorkspace";

import SubmissionPage from "./pages/SubmissionPage";

import SubmissionsPage from "./pages/SubmissionsPage";

import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH ROUTES */}

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<SignupPage />} />

        {/* REDIRECT ROOT */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/problems" />
            </ProtectedRoute>
          }
        />

        {/* PROBLEMS PAGE */}

        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ProblemsPage />
            </ProtectedRoute>
          }
        />

        {/* PROBLEM WORKSPACE */}

        <Route
          path="/problems/:slug"
          element={
            <ProtectedRoute>
              <ProblemWorkspace />
            </ProtectedRoute>
          }
        />

        {/* SINGLE SUBMISSION */}

        <Route
          path="/submission/:id"
          element={
            <ProtectedRoute>
              <SubmissionPage />
            </ProtectedRoute>
          }
        />

        {/* ALL SUBMISSIONS */}

        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <SubmissionsPage />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
