import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ── Pages — all imported from components/pages/ ──────────────────────────────
import { LoginPage }          from "./components/pages/LoginPage";
import { SignupPage }         from "./components/pages/SignupPage";
import { ApplicationsPage }   from "./components/pages/ApplicationsPage";
import { AboutPage }          from "./components/pages/AboutPage";
import { JobVacancyPage }     from "./components/pages/JobVacancyPage";
import { RankedResultsPage }  from "./components/pages/RankedResultsPage";
import { DocumentReviewPage } from "./components/pages/DocumentReviewPage";
import JobCategoriesPage, { CATEGORIES } from "./components/pages/JobCategoriesPage";
import JobMatchesPage         from "./components/pages/JobMatchesPage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
      Loading...
    </div>
  );
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/job-categories" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  function JobCategoriesWrapper() {
    const navigate = useNavigate();
    return (
      <JobCategoriesPage
        onViewJobs={(category) =>
          navigate(`/job-matches/${category.id}`, { state: { category } })
        }
      />
    );
  }

  function JobMatchesWrapper() {
    const { categoryId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const category =
      state?.category ?? CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
    return <JobMatchesPage category={category} onBack={() => navigate(-1)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<ApplicationsPage />} />

      <Route path="/login"  element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

      <Route path="/job-categories"       element={<ProtectedRoute><JobCategoriesWrapper /></ProtectedRoute>} />
      <Route path="/job-matches/:categoryId" element={<ProtectedRoute><JobMatchesWrapper /></ProtectedRoute>} />
      <Route path="/job-vacancy"          element={<ProtectedRoute><JobVacancyPage /></ProtectedRoute>} />
      <Route path="/ranked-results"       element={<ProtectedRoute><RankedResultsPage /></ProtectedRoute>} />
      <Route path="/about"                element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
      <Route path="/document-review"      element={<ProtectedRoute><DocumentReviewPage /></ProtectedRoute>} />
      <Route path="/document-review/:importId?" element={<ProtectedRoute><DocumentReviewPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/job-categories" replace />} />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
