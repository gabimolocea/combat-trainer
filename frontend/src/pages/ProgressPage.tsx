import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, TrackingStats, WorkoutSession } from "@/types";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import TimerIcon from "@mui/icons-material/Timer";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ProgressPage() {
  const { data: stats, isLoading: loadingStats } = useQuery<TrackingStats>({
    queryKey: ["tracking-stats"],
    queryFn: () => api.get("/tracking/stats/").then((r) => r.data),
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery<
    PaginatedResponse<WorkoutSession>
  >({
    queryKey: ["workout-sessions"],
    queryFn: () => api.get("/tracking/sessions/?ordering=-started_at").then((r) => r.data),
  });

  if (loadingStats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.total_sessions ?? 0,
      icon: <FitnessCenterIcon />,
    },
    {
      label: "Total Time",
      value: stats ? formatDuration(stats.total_time_seconds) : "0m",
      icon: <TimerIcon />,
    },
    {
      label: "Current Streak",
      value: `${stats?.current_streak_days ?? 0} days`,
      icon: <LocalFireDepartmentIcon />,
    },
    {
      label: "This Week",
      value: `${stats?.weekly_sessions ?? 0} sessions`,
      icon: <TrendingUpIcon />,
    },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Progress</Typography>

      <Grid container spacing={2}>
        {statCards.map((s) => (
          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {s.icon}
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight={700}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6">Recent Sessions</Typography>

      {loadingSessions ? (
        <CircularProgress />
      ) : !sessions?.results?.length ? (
        <Typography color="text.secondary">No sessions recorded yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {sessions.results.map((s) => (
            <Card key={s.id}>
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <Box>
                  <Typography fontWeight={500}>
                    {s.workout_title ?? "Free Session"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(s.started_at).toLocaleDateString()}
                    {s.duration_seconds ? ` · ${formatDuration(s.duration_seconds)}` : ""}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {s.perceived_intensity && (
                    <Chip
                      label={`Intensity: ${s.perceived_intensity}/10`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={s.status}
                    size="small"
                    color={
                      s.status === "completed"
                        ? "success"
                        : s.status === "in_progress"
                        ? "warning"
                        : "default"
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
