import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { CalendarEvent, WorkoutSession, TrackingStats, PaginatedResponse } from "@/types";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery<TrackingStats>({
    queryKey: ["stats"],
    queryFn: () => api.get("/tracking/stats/").then((r) => r.data),
  });

  const { data: events } = useQuery<PaginatedResponse<CalendarEvent>>({
    queryKey: ["upcoming-events"],
    queryFn: () => api.get("/calendar/events/?status=planned&ordering=starts_at").then((r) => r.data),
  });

  const { data: sessions } = useQuery<PaginatedResponse<WorkoutSession>>({
    queryKey: ["recent-sessions"],
    queryFn: () => api.get("/tracking/sessions/?ordering=-started_at&page_size=5").then((r) => r.data),
  });

  const statCards = [
    { icon: <FitnessCenterIcon />, label: "Total Sessions", value: stats?.total_sessions ?? 0 },
    { icon: <TrendingUpIcon />, label: "This Week", value: stats?.weekly_sessions ?? 0 },
    { icon: <LocalFireDepartmentIcon />, label: "Streak", value: `${stats?.current_streak_days ?? 0} days` },
    { icon: <CalendarMonthIcon />, label: "Total Time", value: `${stats ? Math.round(stats.total_time_seconds / 3600) : 0}h` },
  ];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4">Welcome back, {user?.username}</Typography>
        <Typography color="text.secondary">Here's your training overview</Typography>
      </Box>

      <Grid container spacing={2}>
        {statCards.map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    display: "flex",
                    color: "text.secondary",
                  }}
                >
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                  <Typography variant="h5">{s.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Upcoming Events</Typography>
            <Typography
              component={Link}
              to="/calendar"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              View all
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {events?.results?.length ? (
              events.results.slice(0, 5).map((event) => (
                <Card key={event.id}>
                  <CardContent
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box>
                      <Typography fontWeight={600}>{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.starts_at).toLocaleDateString()} at{" "}
                        {new Date(event.starts_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                    <Chip label={event.event_type} size="small" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No upcoming events.{" "}
                <Link to="/calendar" style={{ color: "inherit" }}>
                  Schedule one
                </Link>
              </Typography>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Recent Sessions</Typography>
            <Typography
              component={Link}
              to="/progress"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              View all
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {sessions?.results?.length ? (
              sessions.results.map((session) => (
                <Card key={session.id}>
                  <CardContent
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {session.workout_title ?? "Quick Session"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(session.started_at).toLocaleDateString()}
                        {session.duration_seconds &&
                          ` · ${Math.round(session.duration_seconds / 60)} min`}
                      </Typography>
                    </Box>
                    <Chip
                      label={session.status}
                      size="small"
                      color={session.status === "completed" ? "success" : "default"}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No sessions yet.{" "}
                <Link to="/workouts" style={{ color: "inherit" }}>
                  Start training
                </Link>
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
