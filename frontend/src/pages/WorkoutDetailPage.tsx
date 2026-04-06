import { useState } from "react";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TimerIcon from "@mui/icons-material/Timer";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "@/features/auth/AuthContext";
import WorkoutBuilder from "@/components/WorkoutBuilder";

export default function WorkoutDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [builderState, setBuilderState] = useState<any>(null);
  const [saveError, setSaveError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: exercisesData } = useQuery<any>({
    queryKey: ["exercises-all-detail"],
    queryFn: () => api.get("/exercises/?page_size=200").then((r) => r.data),
    enabled: editMode,
  });
  const exercises = exercisesData?.results ?? [];

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

  const deleteWorkout = useMutation({
    mutationFn: () => api.delete(`/workouts/${slug}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      navigate("/workouts");
    },
  });

  const saveExercises = useMutation({
    mutationFn: (state: any) => {
      const durationSeconds = state.items
        .filter((item: any) => item.type === "exercise")
        .reduce((sum: number, e: any) => {
          const work = e.work_seconds
            ? e.work_seconds * (e.sets ?? 1)
            : (e.sets ?? 3) * (e.reps ?? 10) * 4;
          const rest = (e.rest_seconds ?? 60) * Math.max((e.sets ?? 1) - 1, 0);
          return sum + work + rest;
        }, 0);
      return api.patch(`/workouts/${slug}/`, {
        title: state.title,
        description: state.description,
        difficulty_level: state.difficulty_level,
        estimated_duration_minutes: Math.round(durationSeconds / 60) || null,
        blocks: [
          {
            block_type: "training",
            title: "Workout",
            notes: "",
            sort_order: 1,
            exercises: state.items
              .filter((item: any) => item.type === "exercise" && item.exercise > 0)
              .map((e: any, idx: number) => ({
                exercise: e.exercise,
                sort_order: idx + 1,
                sets: e.sets,
                reps: e.reps,
                work_seconds: e.work_seconds,
                rest_seconds: e.rest_seconds,
                notes: e.notes || "",
              })),
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", slug] });
      setEditMode(false);
      setSaveError("");
    },
    onError: () => setSaveError("Failed to save. Please try again."),
  });

  const enterEditMode = (w: Workout) => {
    const items = w.blocks.flatMap((block) =>
      block.exercises.map((we) => ({
        id: String(we.id),
        type: "exercise" as const,
        exercise: we.exercise,
        exercise_title: we.exercise_title,
        parameterType: (we.work_seconds ? "time" : "sets_reps") as "sets_reps" | "time",
        sets: we.sets ?? 3,
        reps: we.reps ?? 10,
        work_seconds: we.work_seconds,
        rest_type: "rest_seconds" as const,
        rest_seconds: we.rest_seconds ?? 60,
        weight_type: "weight" as const,
        weight: null,
        notes: "",
      }))
    );
    setBuilderState({
      title: w.title,
      description: w.description,
      difficulty_level: w.difficulty_level,
      items,
    });
    setSaveError("");
    setEditMode(true);
  };

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
    <>
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4">{workout.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            by {workout.created_by.username}
          </Typography>
        </Box>
        {editMode ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button onClick={() => { setEditMode(false); setSaveError(""); }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => builderState && saveExercises.mutate(builderState)}
              disabled={saveExercises.isPending}
              sx={{ bgcolor: "success.main" }}
            >
              {saveExercises.isPending ? "Saving…" : "Save Workout"}
            </Button>
          </Stack>
        ) : (
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
            {user && workout.created_by?.id === user.id && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => enterEditMode(workout)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        )}
      </Stack>

      {!editMode && activeSession && (
        <Alert
          severity="info"
          icon={<TimerIcon />}
          sx={{ borderRadius: 2 }}
        >
          Workout in progress — started {new Date(activeSession.started_at).toLocaleTimeString()}
        </Alert>
      )}

      {!editMode && completeSession.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Workout completed!
        </Alert>
      )}

      {editMode ? (
        <>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <WorkoutBuilder
            initialState={builderState ?? undefined}
            exercises={exercises}
            onStateChange={setBuilderState}
          />
        </>
      ) : (
        <>
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

      {(() => {
        const allExercises = workout.blocks.flatMap((b) => b.exercises);
        if (allExercises.length === 0) {
          return (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="text.secondary" gutterBottom>
                No exercises yet.
              </Typography>
              {user && workout.created_by?.id === user.id && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => enterEditMode(workout)}
                  sx={{ mt: 1 }}
                >
                  Add Exercises
                </Button>
              )}
            </Box>
          );
        }
        return (
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {allExercises.length} {allExercises.length === 1 ? "Exercise" : "Exercises"}
            </Typography>
            {allExercises.map((we, idx) => (
              <Card key={we.id} variant="outlined">
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.disabled", minWidth: 24, fontWeight: 600 }}
                    >
                      {idx + 1}
                    </Typography>
                    <Typography
                      component={RouterLink}
                      to={`/exercises/${(we as any).exercise_slug ?? we.exercise}`}
                      sx={{ textDecoration: "none", color: "text.primary", fontWeight: 500, flex: 1 }}
                    >
                      {we.exercise_title}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {we.sets && <Chip label={`${we.sets} sets`} size="small" variant="outlined" />}
                      {we.reps && <Chip label={`${we.reps} reps`} size="small" variant="outlined" />}
                      {we.work_seconds && (
                        <Chip label={`${we.work_seconds}s work`} size="small" variant="outlined" />
                      )}
                      {we.rest_seconds && (
                        <Chip label={`${we.rest_seconds}s rest`} size="small" color="default" variant="outlined" />
                      )}
                    </Stack>
                  </Stack>
                  {(we as any).notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 4.5, display: "block", mt: 0.5 }}>
                      {(we as any).notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        );
      })()}
        </>
      )}
    </Stack>

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Workout?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{workout?.title}" will be permanently deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteWorkout.mutate()}
            disabled={deleteWorkout.isPending}
          >
            {deleteWorkout.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
