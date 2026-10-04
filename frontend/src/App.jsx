import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Problems from "./pages/Problems";
import NotFound from "./pages/NotFound";

// Monaco and the charts are heavy: load them only when those pages are visited.
const ProblemWorkspace = lazy(() => import("./pages/ProblemWorkspace"));
const Profile = lazy(() => import("./pages/Profile"));

const Fallback = () => (
  <div className="flex h-[60vh] items-center justify-center gap-3 text-dim">
    <Spinner size={20} /> Loading…
  </div>
);

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/problems" element={<ProtectedRoute><Problems /></ProtectedRoute>} />
            <Route path="/problems/:slug" element={<ProtectedRoute><ProblemWorkspace /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
