import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/features/auth/AuthContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ExercisesPage from "@/pages/ExercisesPage";
import ExerciseDetailPage from "@/pages/ExerciseDetailPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import PlansPage from "@/pages/PlansPage";
import PlanDetailPage from "@/pages/PlanDetailPage";
import CalendarPage from "@/pages/CalendarPage";
import SocialPage from "@/pages/SocialPage";
import ProgressPage from "@/pages/ProgressPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import ExerciseFormPage from "@/pages/ExerciseFormPage";
import WorkoutBuilderPage from "@/pages/WorkoutBuilderPage";
import PlanBuilderPage from "@/pages/PlanBuilderPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/exercises" element={<ExercisesPage />} />
                <Route path="/exercises/new" element={<ExerciseFormPage />} />
                <Route path="/exercises/:slug/edit" element={<ExerciseFormPage />} />
                <Route path="/exercises/:slug" element={<ExerciseDetailPage />} />
                <Route path="/workouts" element={<WorkoutsPage />} />
                <Route path="/workouts/new" element={<WorkoutBuilderPage />} />
                <Route path="/workouts/:slug" element={<WorkoutDetailPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/plans/new" element={<PlanBuilderPage />} />
                <Route path="/plans/:slug" element={<PlanDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/social" element={<SocialPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
