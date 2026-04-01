import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { Workout, WorkoutSession } from "@/types";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TimerIcon from "@mui/icons-material/Timer";

export default function WorkoutDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workout, isLoading } = useQuery<Workout>({
    queryKey: ["workout", slug],
    queryFn: () => api.get(`/workouts/${slug}/`).then((r) => r.data),
  });

  // Check for an active (in_progress) session for this workout
  const { data: activeSession } = useQuery<WorkoutSession | null>({
    queryKey: ["active-session", workout?.id],
    enabled: !!workout,
    queryFn: () =>
      api
        .get("/tracking/sessions/", { params: { status: "in_progress" } })
        .then((r) => {
          const sessions: WorkoutSession[] = r.data.results ?? r.data;
          return sessions.find((s) => s.workout === workout!.id) ?? null;
        }),
  });

  const startSession = useMutation({
    mutationFn: () =>
      api.post("/tracking/sessions/", { workout: workout?.id, status: "in_progress" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-session", workout?.id] });
      queryClient.invalidateQueries({ queryKey: ["tracking-stats"] });
    },
  });

  const completeSession = useMutation({
    mutationFn: (sessionId: number) =>
      api.post(`/tracking/sessions/${sessionId}/complete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-session", workout?.id] });
      queryClient.invalidateQueries({ queryKey: ["tracking-stats"] });
    },
  });

  const duplicateWorkout = useMutation({
    mutationFn: () => api.post(`/workouts/${slug}/duplicate/`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      navigate(`/workouts/${res.data.slug}`);
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!workout) {
    return <Typography color="error">Workout not found.</Typography>;
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4">{workout.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            by {workout.created_by.username}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {activeSession ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => completeSession.mutate(activeSession.id)}
              disabled={completeSession.isPending}
            >
              End Workout
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => startSession.mutate()}
              disabled={startSession.isPending}
            >
              Start Session
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => duplicateWorkout.mutate()}
            disabled={duplicateWorkout.isPending}
          >
            Duplicate
          </Button>
        </Stack>
      </Stack>

      {activeSession && (
        <Alert
          severity="info"
          icon={<TimerIcon />}
          sx={{ borderRadius: 2 }}
        >
          Workout in progress — started {new Date(activeSession.started_at).toLocaleTimeString()}
        </Alert>
      )}

      {completeSession.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Workout completed!
        </Alert>
      )}

      {workout.description && (
        <Typography variant="body1" color="text.secondary">
          {workout.description}
        </Typography>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={workout.difficulty_level} />
        {workout.estimated_duration_minutes && (
          <Chip label={`${workout.estimated_duration_minutes} min`} variant="outlined" />
        )}
        {workout.primary_style_name && (
          <Chip label={workout.primary_style_name} variant="outlined" />
        )}
        <Chip label={workout.visibility} variant="outlined" />
      </Stack>

      <Divider />

      {workout.blocks.length === 0 ? (
        <Typography color="text.secondary">No blocks in this workout.</Typography>
      ) : (
        workout.blocks.map((block) => (
          <Card key={block.id}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Chip label={block.block_type} size="small" color="secondary" />
                <Typography variant="h6">{block.title}</Typography>
              </Stack>
              {block.notes && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {block.notes}
                </Typography>
              )}
              {block.exercises.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No exercises.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {block.exercises.map((we) => (
                    <Box
                      key={we.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography
                        component={RouterLink}
                        to={`/exercises/${(we as any).exercise_slug ?? we.exercise}`}
                        sx={{ textDecoration: "none", color: "primary.main", fontWeight: 500 }}
                      >
                        {we.exercise_title}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {we.sets && <Chip label={`${we.sets} sets`} size="small" variant="outlined" />}
                        {we.reps && <Chip label={`${we.reps} reps`} size="small" variant="outlined" />}
                        {we.work_seconds && (
                          <Chip label={`${we.work_seconds}s work`} size="small" variant="outlined" />
                        )}
                        {we.rest_seconds && (
                          <Chip label={`${we.rest_seconds}s rest`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
