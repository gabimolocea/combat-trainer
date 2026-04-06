import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { TrainingPlan, PaginatedResponse, Workout } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface DayForm {
  day_number: number;
  title: string;
  workout: number | null;
  notes: string;
}

interface WeekForm {
  week_number: number;
  title: string;
  notes: string;
  days: DayForm[];
}

export default function PlanDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("beginner");
  const [editWeeks, setEditWeeks] = useState<WeekForm[]>([]);

  const { data: plan, isLoading } = useQuery<TrainingPlan>({
    queryKey: ["plan", slug],
    queryFn: () => api.get(`/plans/${slug}/`).then((r) => r.data),
  });

  const { data: workoutsData } = useQuery<PaginatedResponse<Workout>>({
    queryKey: ["workouts-all"],
    queryFn: () => api.get("/workouts/?page_size=200").then((r) => r.data),
    enabled: editMode,
  });
  const workouts = workoutsData?.results ?? [];

  const savePlan = useMutation({
    mutationFn: () =>
      api.patch(`/plans/${slug}/`, {
        title: editTitle,
        description: editDescription,
        difficulty_level: editDifficulty,
        duration_weeks: editWeeks.length,
        weeks: editWeeks.map((w, wi) => ({
          week_number: wi + 1,
          title: w.title,
          notes: w.notes,
          days: w.days.map((d, di) => ({
            day_number: di + 1,
            title: d.title,
            workout: d.workout,
            notes: d.notes,
          })),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", slug] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setEditMode(false);
      setSaveError("");
    },
    onError: () => setSaveError("Failed to save. Please try again."),
  });

  const deletePlan = useMutation({
    mutationFn: () => api.delete(`/plans/${slug}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      navigate("/plans");
    },
  });

  const enterEditMode = (p: TrainingPlan) => {
    setEditTitle(p.title);
    setEditDescription(p.description);
    setEditDifficulty(p.difficulty_level);
    setEditWeeks(
      p.weeks.map((w) => ({
        week_number: w.week_number,
        title: w.title,
        notes: w.notes,
        days: w.days.map((d) => ({
          day_number: d.day_number,
          title: d.title,
          workout: d.workout,
          notes: d.notes,
        })),
      }))
    );
    setSaveError("");
    setEditMode(true);
  };

  // Week/Day helpers
  const addWeek = () =>
    setEditWeeks((prev) => [...prev, { week_number: prev.length + 1, title: "", notes: "", days: [] }]);

  const removeWeek = (wi: number) => setEditWeeks((prev) => prev.filter((_, i) => i !== wi));

  const updateWeek = <K extends keyof WeekForm>(wi: number, key: K, value: WeekForm[K]) =>
    setEditWeeks((prev) => prev.map((w, i) => (i === wi ? { ...w, [key]: value } : w)));

  const addDay = (wi: number) =>
    setEditWeeks((prev) =>
      prev.map((w, i) =>
        i === wi
          ? { ...w, days: [...w.days, { day_number: w.days.length + 1, title: "", workout: null, notes: "" }] }
          : w
      )
    );

  const removeDay = (wi: number, di: number) =>
    setEditWeeks((prev) =>
      prev.map((w, i) => (i === wi ? { ...w, days: w.days.filter((_, j) => j !== di) } : w))
    );

  const updateDay = (wi: number, di: number, field: keyof DayForm, value: any) =>
    setEditWeeks((prev) =>
      prev.map((w, i) =>
        i === wi ? { ...w, days: w.days.map((d, j) => (j === di ? { ...d, [field]: value } : d)) } : w
      )
    );

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return <Typography color="error">Plan not found.</Typography>;
  }

  const isOwner = user && plan.created_by?.id === user.id;

  return (
    <>
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4">{plan.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            by {plan.created_by.username}
          </Typography>
        </Box>
        {editMode ? (
          <Stack direction="row" spacing={1}>
            <Button onClick={() => { setEditMode(false); setSaveError(""); }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => savePlan.mutate()}
              disabled={savePlan.isPending}
              sx={{ bgcolor: "success.main" }}
            >
              {savePlan.isPending ? "Saving…" : "Save Plan"}
            </Button>
          </Stack>
        ) : (
          isOwner && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => enterEditMode(plan)}>
                Edit
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            </Stack>
          )
        )}
      </Stack>

      {/* View mode */}
      {!editMode && (
        <>
          {plan.description && (
            <Typography variant="body1" color="text.secondary">{plan.description}</Typography>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={plan.difficulty_level} />
            <Chip label={`${plan.duration_weeks} weeks`} variant="outlined" />
            <Chip label={plan.visibility} variant="outlined" />
          </Stack>
          <Divider />
          {plan.weeks.length === 0 ? (
            <Typography color="text.secondary">No weeks defined for this plan.</Typography>
          ) : (
            plan.weeks.map((week) => (
              <Card key={week.id}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Week {week.week_number}{week.title ? `: ${week.title}` : ""}
                  </Typography>
                  {week.notes && (
                    <Typography variant="body2" color="text.secondary" mb={1.5}>{week.notes}</Typography>
                  )}
                  {week.days.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No days scheduled.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {week.days.map((day) => (
                        <Box
                          key={day.id}
                          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}
                        >
                          <Box>
                            <Typography fontWeight={500}>
                              Day {day.day_number}{day.title ? `: ${day.title}` : ""}
                            </Typography>
                            {day.notes && (
                              <Typography variant="body2" color="text.secondary">{day.notes}</Typography>
                            )}
                          </Box>
                          {day.workout_title ? (
                            <Chip label={day.workout_title} size="small" variant="outlined" />
                          ) : (
                            <Chip label="Rest Day" size="small" />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}

      {/* Edit mode */}
      {editMode && (
        <Stack spacing={3}>
          {saveError && <Alert severity="error">{saveError}</Alert>}

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <TextField label="Plan Title" fullWidth required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <TextField label="Description" fullWidth multiline rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                <TextField
                  select label="Difficulty" value={editDifficulty}
                  onChange={(e) => setEditDifficulty(e.target.value)} sx={{ minWidth: 200 }}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>

          {editWeeks.map((week, wi) => (
            <Card key={wi}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Week {wi + 1}</Typography>
                  <IconButton color="error" size="small" onClick={() => removeWeek(wi)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
                <Stack spacing={2}>
                  <TextField label="Week Title" fullWidth value={week.title} onChange={(e) => updateWeek(wi, "title", e.target.value)} />
                  <TextField label="Notes" fullWidth multiline rows={2} value={week.notes} onChange={(e) => updateWeek(wi, "notes", e.target.value)} />
                  <Typography variant="subtitle2" mt={1}>Days</Typography>
                  {week.days.map((day, di) => (
                    <Box key={di} sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={500} sx={{ minWidth: 60 }}>Day {di + 1}</Typography>
                        <TextField label="Title" size="small" fullWidth value={day.title} onChange={(e) => updateDay(wi, di, "title", e.target.value)} />
                        <TextField
                          select label="Workout" size="small" sx={{ minWidth: 200 }}
                          value={day.workout ?? ""}
                          onChange={(e) => updateDay(wi, di, "workout", e.target.value ? Number(e.target.value) : null)}
                        >
                          <MenuItem value="">— Rest Day —</MenuItem>
                          {workouts.map((w) => (
                            <MenuItem key={w.id} value={w.id}>{w.title}</MenuItem>
                          ))}
                        </TextField>
                        <IconButton size="small" color="error" onClick={() => removeDay(wi, di)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addDay(wi)}>Add Day</Button>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={addWeek}>Add Week</Button>
        </Stack>
      )}
    </Stack>

    <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
      <DialogTitle>Delete Plan?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          "{plan.title}" will be permanently deleted. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => deletePlan.mutate()}
          disabled={deletePlan.isPending}
        >
          {deletePlan.isPending ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

