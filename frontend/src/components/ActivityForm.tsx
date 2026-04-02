import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarAPI } from "@/api/calendar";
import type { TrainingType, Workout } from "@/types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
  Alert,
  Stack,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import api from "@/api/client";

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  selectedDay: string | null;
  activityType: "quick_training" | "workout" | null;
  editingActivity?: any;
}

export default function ActivityForm({
  open,
  onClose,
  selectedDay,
  activityType,
  editingActivity,
}: ActivityFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    training_type: "",
    workout: "",
    start_time: "09:00",
    duration_minutes: 30,
  });
  const [error, setError] = useState("");
  const [creatingWorkout, setCreatingWorkout] = useState(false);
  const [newWorkoutData, setNewWorkoutData] = useState({
    title: "",
    description: "",
    difficulty_level: "beginner" as "beginner" | "intermediate" | "advanced" | "expert",
    estimated_duration_minutes: null as number | null,
    blocks: [] as Array<{
      block_type: string;
      title: string;
      notes: string;
      sort_order: number;
      exercises: Array<{
        exercise: number;
        exercise_title: string;
        sort_order: number;
        reps: number | null;
        sets: number | null;
        work_seconds: number | null;
        rest_seconds: number | null;
        notes: string;
      }>;
    }>,
  });

  // Fetch exercise options
  const { data: exercisesData } = useQuery<any>({
    queryKey: ["exercises-all-calendar"],
    queryFn: () =>
      api.get("/exercises/?page_size=200").then((r) => r.data),
    enabled: creatingWorkout,
  });
  const exercises = exercisesData?.results ?? [];

  // Fetch training types
  const { data: trainingTypes = [] } = useQuery<TrainingType[]>({
    queryKey: ["training-types"],
    queryFn: () => calendarAPI.getTrainingTypes().then((r) => r.data.results),
  });

  // Fetch workouts
  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["workouts-list"],
    queryFn: () =>
      api.get("/workouts/", { params: { page_size: 100 } }).then((r) => r.data.results),
  });

  // Fetch full workout details when editing
  const workoutId = editingActivity?.workout 
    ? (typeof editingActivity.workout === 'string' ? parseInt(editingActivity.workout) : editingActivity.workout)
    : (formData.workout ? parseInt(formData.workout) : null);
  
  // Find the workout slug from the workouts list
  const selectedWorkout = workouts.find(w => w.id === workoutId);
  const workoutSlug = selectedWorkout?.slug;
  
  const { data: selectedWorkoutDetails } = useQuery<Workout>({
    queryKey: ["workout-details", workoutSlug],
    queryFn: () => {
      if (!workoutSlug) return Promise.reject("No workout slug");
      return api.get(`/workouts/${workoutSlug}/`).then((r) => r.data);
    },
    enabled: !!workoutSlug && activityType === "workout",
  });

  useEffect(() => {
    if (editingActivity) {
      setFormData({
        training_type: editingActivity.training_type || "",
        workout: editingActivity.workout || "",
        start_time: editingActivity.start_time || "09:00",
        duration_minutes:
          editingActivity.duration_minutes ||
          editingActivity.total_duration_minutes ||
          30,
      });
    } else {
      setFormData({
        training_type: "",
        workout: "",
        start_time: "09:00",
        duration_minutes: 30,
      });
    }
    setError("");
  }, [editingActivity, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDay || !activityType) return Promise.reject("Missing data");

      if (activityType === "quick_training") {
        const payload = {
          training_type: parseInt(formData.training_type),
          scheduled_date: selectedDay,
          start_time: formData.start_time,
          duration_minutes: formData.duration_minutes,
        };
        console.log("📤 Creating quick training with payload:", payload);
        return calendarAPI.createQuickTraining(payload);
      } else {
        const payload = {
          workout: parseInt(formData.workout),
          scheduled_date: selectedDay,
          start_time: formData.start_time,
          total_duration_minutes: formData.duration_minutes,
        };
        console.log("📤 Creating workout with payload:", payload);
        return calendarAPI.createWorkout(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-month-grid"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      onClose();
    },
    onError: (err: any) => {
      console.error("❌ Create mutation error:", err);
      console.error("Error response data:", err.response?.data);
      
      let message = "Failed to create activity";
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.response?.data) {
        // Handle field-level errors
        const fieldErrors = Object.entries(err.response.data)
          .map(([field, errors]: [string, any]) => {
            const errorStr = Array.isArray(errors) ? errors.join(", ") : errors;
            return `${field}: ${errorStr}`;
          })
          .join(" | ");
        if (fieldErrors) message = fieldErrors;
      }
      setError(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingActivity) return Promise.reject("No activity to update");

      const updateData = {
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
      };

      if (activityType === "quick_training") {
        return calendarAPI.updateQuickTraining(editingActivity.id, {
          ...updateData,
          training_type: parseInt(formData.training_type),
        });
      } else {
        return calendarAPI.updateWorkout(editingActivity.id, {
          ...updateData,
          workout: parseInt(formData.workout),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-month-grid"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      onClose();
    },
    onError: (err: any) => {
      console.error("❌ Update mutation error:", err);
      console.error("Error response data:", err.response?.data);
      
      let message = "Failed to update activity";
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.response?.data) {
        // Handle field-level errors
        const fieldErrors = Object.entries(err.response.data)
          .map(([field, errors]: [string, any]) => {
            const errorStr = Array.isArray(errors) ? errors.join(", ") : errors;
            return `${field}: ${errorStr}`;
          })
          .join(" | ");
        if (fieldErrors) message = fieldErrors;
      }
      setError(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editingActivity) return Promise.reject("No activity to delete");

      if (activityType === "quick_training") {
        return calendarAPI.deleteQuickTraining(editingActivity.id);
      } else {
        return calendarAPI.deleteWorkout(editingActivity.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-month-grid"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      onClose();
    },
    onError: (err: any) => {
      console.error("❌ Delete mutation error:", err);
      const message = err.response?.data?.detail || "Failed to delete activity";
      setError(message);
    },
  });

  // Create new workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!newWorkoutData.title.trim()) {
        setError("Workout title is required");
        return Promise.reject("Workout title required");
      }

      const payload = {
        title: newWorkoutData.title.trim(),
        description: newWorkoutData.description.trim(),
        difficulty_level: newWorkoutData.difficulty_level,
        estimated_duration_minutes: newWorkoutData.estimated_duration_minutes,
        blocks: newWorkoutData.blocks.map((b, bi) => ({
          block_type: b.block_type,
          title: b.title,
          notes: b.notes,
          sort_order: bi + 1,
          exercises: b.exercises
            .filter((e) => e.exercise > 0)
            .map((e, ei) => ({
              exercise: e.exercise,
              sort_order: ei + 1,
              reps: e.reps,
              sets: e.sets,
              work_seconds: e.work_seconds,
              rest_seconds: e.rest_seconds,
              notes: e.notes,
            })),
        })),
      };

      return api.post("/workouts/", payload);
    },
    onSuccess: (response: any) => {
      const newWorkoutId = response.data?.id;
      if (!newWorkoutId) {
        setError("Failed to get workout ID from response");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["workouts-list"] });
      queryClient.invalidateQueries({ queryKey: ["workout-details"] });
      setFormData((prev) => ({ ...prev, workout: String(newWorkoutId) }));
      setCreatingWorkout(false);
      setNewWorkoutData({
        title: "",
        description: "",
        difficulty_level: "beginner",
        estimated_duration_minutes: null,
        blocks: [],
      });
      setError("");
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail || err.response?.data?.title?.[0] || "Failed to create workout";
      setError(message);
    },
  });

  const addBlock = () => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          block_type: "technique",
          title: "",
          notes: "",
          sort_order: prev.blocks.length + 1,
          exercises: [],
        },
      ],
    }));
  };

  const removeBlock = (blockIdx: number) => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== blockIdx),
    }));
  };

  const updateBlock = <K extends keyof typeof newWorkoutData.blocks[0]>(
    blockIdx: number,
    key: K,
    value: any
  ) => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) =>
        i === blockIdx ? { ...b, [key]: value } : b
      ),
    }));
  };

  const addExerciseToBlock = (blockIdx: number) => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              exercises: [
                ...b.exercises,
                {
                  exercise: 0,
                  exercise_title: "",
                  sort_order: b.exercises.length + 1,
                  reps: null,
                  sets: null,
                  work_seconds: null,
                  rest_seconds: null,
                  notes: "",
                },
              ],
            }
          : b
      ),
    }));
  };

  const removeExerciseFromBlock = (blockIdx: number, exIdx: number) => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) =>
        i === blockIdx
          ? { ...b, exercises: b.exercises.filter((_, j) => j !== exIdx) }
          : b
      ),
    }));
  };

  const updateExerciseEntry = (
    blockIdx: number,
    exIdx: number,
    field: string,
    value: any
  ) => {
    setNewWorkoutData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              exercises: b.exercises.map((e, j) =>
                j === exIdx ? { ...e, [field]: value } : e
              ),
            }
          : b
      ),
    }));
  };

  const handleSubmit = () => {
    if (creatingWorkout) {
      // Creating new workout
      createWorkoutMutation.mutate();
    } else {
      // Scheduling activity
      if (activityType === "quick_training" && !formData.training_type) {
        setError("Please select a training type");
        return;
      }
      if (activityType === "workout" && !formData.workout) {
        setError("Please select a workout");
        return;
      }

      if (editingActivity) {
        updateMutation.mutate();
      } else {
        createMutation.mutate();
      }
    }
  };

  const isLoading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || createWorkoutMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {creatingWorkout
          ? "Create Workout"
          : editingActivity
          ? "Edit Activity"
          : `Schedule ${activityType === "quick_training" ? "Quick Training" : "Workout"}`}
      </DialogTitle>
      <DialogContent sx={{ maxHeight: creatingWorkout ? "85vh" : "80vh", overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* When editing: show workout details first and prominently */}
          {editingActivity && activityType === "workout" && selectedWorkoutDetails && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {selectedWorkoutDetails.title}
                </Typography>
                {selectedWorkoutDetails.description && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    {selectedWorkoutDetails.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  {selectedWorkoutDetails.difficulty_level && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Difficulty:
                      </Typography>
                      <Typography variant="caption" sx={{ textTransform: "capitalize" }}>
                        {selectedWorkoutDetails.difficulty_level}
                      </Typography>
                    </Box>
                  )}
                  {selectedWorkoutDetails.estimated_duration_minutes && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Est. Duration:
                      </Typography>
                      <Typography variant="caption">
                        {selectedWorkoutDetails.estimated_duration_minutes} min
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Workout Blocks and Exercises - Prominent Display */}
              {selectedWorkoutDetails.blocks && selectedWorkoutDetails.blocks.length > 0 && (
                <Card sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", mb: 2 }}>
                  <CardContent sx={{ pb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Workout Structure
                    </Typography>
                    <Stack spacing={1}>
                      {selectedWorkoutDetails.blocks.map((block: any, blockIdx: number) => (
                        <Card
                          key={blockIdx}
                          variant="outlined"
                          sx={{
                            bgcolor: "background.default",
                            p: 1,
                            border: "1px solid",
                            borderColor: "action.disabled",
                          }}
                        >
                          <Box sx={{ mb: 0.75 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "inline-block",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                              }}
                            >
                              {block.block_type.toUpperCase()}
                            </Typography>
                            {block.title && (
                              <Typography variant="caption" sx={{ fontWeight: 600, ml: 1 }}>
                                {block.title}
                              </Typography>
                            )}
                          </Box>
                          {block.exercises && block.exercises.length > 0 && (
                            <Stack spacing={0.5}>
                              {block.exercises.map((exercise: any, exIdx: number) => (
                                <Box
                                  key={exIdx}
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    p: 0.5,
                                    bgcolor: "background.paper",
                                    borderRadius: 0.5,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 500, flex: 1 }}>
                                    {exercise.exercise_title}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 0.75,
                                      ml: 1,
                                      fontSize: "0.65rem",
                                      color: "text.secondary",
                                    }}
                                  >
                                    {exercise.sets && <Box>{exercise.sets}×</Box>}
                                    {exercise.reps && <Box>{exercise.reps}r</Box>}
                                    {exercise.work_seconds && <Box>{exercise.work_seconds}s</Box>}
                                    {exercise.rest_seconds && <Box>R:{exercise.rest_seconds}s</Box>}
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Card>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Scheduling Controls when editing */}
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Schedule
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    type="time"
                    label="Start Time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="number"
                    label="Duration (minutes)"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: parseInt(e.target.value),
                      })
                    }
                    fullWidth
                    inputProps={{ min: 5, step: 5 }}
                  />
                  <TextField
                    label="Date"
                    value={selectedDay || ""}
                    fullWidth
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>
            </>
          )}

          {/* When NOT editing: show activity type selector */}
          {!editingActivity && activityType === "quick_training" && (
            <TextField
              select
              label="Training Type"
              value={formData.training_type}
              onChange={(e) =>
                setFormData({ ...formData, training_type: e.target.value })
              }
              fullWidth
              required
            >
              {trainingTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {!editingActivity && activityType === "workout" && !creatingWorkout && (
            <Stack spacing={1}>
              <TextField
                select
                label="Workout"
                value={formData.workout}
                onChange={(e) => {
                  setFormData({ ...formData, workout: e.target.value });
                  setError("");
                }}
                fullWidth
                required
              >
                <MenuItem value="" disabled>
                  Select a workout
                </MenuItem>
                {workouts.map((workout) => (
                  <MenuItem key={workout.id} value={workout.id}>
                    {workout.title}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setCreatingWorkout(true)}
              >
                + Create New Workout
              </Button>
            </Stack>
          )}

          {!editingActivity && activityType === "workout" && creatingWorkout && (
            // Full workout builder interface
            <Stack spacing={2}>
              {/* Basic Info */}
              <TextField
                label="Workout Title"
                value={newWorkoutData.title}
                onChange={(e) =>
                  setNewWorkoutData({ ...newWorkoutData, title: e.target.value })
                }
                fullWidth
                placeholder="e.g., Morning Run, Strength Training"
                required
              />
              <TextField
                label="Description"
                value={newWorkoutData.description}
                onChange={(e) =>
                  setNewWorkoutData({ ...newWorkoutData, description: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                placeholder="Describe your workout..."
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Difficulty Level"
                  select
                  value={newWorkoutData.difficulty_level}
                  onChange={(e) =>
                    setNewWorkoutData({
                      ...newWorkoutData,
                      difficulty_level: e.target.value as "beginner" | "intermediate" | "advanced" | "expert",
                    })
                  }
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </TextField>
                <TextField
                  label="Est. Duration (min)"
                  type="number"
                  value={newWorkoutData.estimated_duration_minutes || ""}
                  onChange={(e) =>
                    setNewWorkoutData({
                      ...newWorkoutData,
                      estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  inputProps={{ min: 5, step: 5 }}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Blocks */}
              {newWorkoutData.blocks.length > 0 && (
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Workout Blocks
                  </Typography>
                  <Stack spacing={1.5}>
                    {newWorkoutData.blocks.map((block, blockIdx) => (
                      <Card
                        key={blockIdx}
                        variant="outlined"
                        sx={{ p: 1.5, bgcolor: "background.default" }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, flex: 1 }}>
                            <TextField
                              select
                              label="Type"
                              size="small"
                              value={block.block_type}
                              onChange={(e) => updateBlock(blockIdx, "block_type", e.target.value)}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="warmup">Warmup</MenuItem>
                              <MenuItem value="technique">Technique</MenuItem>
                              <MenuItem value="rounds">Rounds</MenuItem>
                              <MenuItem value="conditioning">Conditioning</MenuItem>
                              <MenuItem value="cooldown">Cooldown</MenuItem>
                            </TextField>
                            <TextField
                              label="Block Title"
                              size="small"
                              value={block.title}
                              onChange={(e) => updateBlock(blockIdx, "title", e.target.value)}
                              sx={{ flex: 1 }}
                            />
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeBlock(blockIdx)}
                          >
                            Remove
                          </Button>
                        </Box>

                        {/* Exercises in block */}
                        {block.exercises.length > 0 && (
                          <Stack spacing={0.75} sx={{ ml: 1, mb: 1, pl: 1, borderLeft: "2px solid", borderColor: "primary.main" }}>
                            {block.exercises.map((exercise, exIdx) => (
                              <Box
                                key={exIdx}
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 60px 60px 60px 60px 40px",
                                  gap: 0.75,
                                  alignItems: "end",
                                  bgcolor: "background.paper",
                                  p: 0.75,
                                  borderRadius: 1,
                                }}
                              >
                                <TextField
                                  select
                                  label="Exercise"
                                  size="small"
                                  value={exercise.exercise}
                                  onChange={(e) =>
                                    updateExerciseEntry(
                                      blockIdx,
                                      exIdx,
                                      "exercise",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  fullWidth
                                >
                                  <MenuItem value={0} disabled>
                                    Select exercise
                                  </MenuItem>
                                  {exercises.map((ex: any) => (
                                    <MenuItem key={ex.id} value={ex.id}>
                                      {ex.title}
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <TextField
                                  label="Sets"
                                  type="number"
                                  size="small"
                                  value={exercise.sets || ""}
                                  onChange={(e) =>
                                    updateExerciseEntry(
                                      blockIdx,
                                      exIdx,
                                      "sets",
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                />
                                <TextField
                                  label="Reps"
                                  type="number"
                                  size="small"
                                  value={exercise.reps || ""}
                                  onChange={(e) =>
                                    updateExerciseEntry(
                                      blockIdx,
                                      exIdx,
                                      "reps",
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                />
                                <TextField
                                  label="Work"
                                  type="number"
                                  size="small"
                                  value={exercise.work_seconds || ""}
                                  onChange={(e) =>
                                    updateExerciseEntry(
                                      blockIdx,
                                      exIdx,
                                      "work_seconds",
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                />
                                <TextField
                                  label="Rest"
                                  type="number"
                                  size="small"
                                  value={exercise.rest_seconds || ""}
                                  onChange={(e) =>
                                    updateExerciseEntry(
                                      blockIdx,
                                      exIdx,
                                      "rest_seconds",
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                />
                                <Button
                                  size="small"
                                  color="error"
                                  sx={{ minWidth: 40 }}
                                  onClick={() => removeExerciseFromBlock(blockIdx, exIdx)}
                                >
                                  ×
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => addExerciseToBlock(blockIdx)}
                          sx={{ mt: 0.75 }}
                        >
                          + Add Exercise
                        </Button>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              <Button
                variant="outlined"
                onClick={addBlock}
                fullWidth
              >
                + Add Block
              </Button>
            </Stack>
          )}

          {/* Workout Details Preview when selecting workout to schedule */}
          {!editingActivity && !creatingWorkout && activityType === "workout" && selectedWorkoutDetails && (
            <Card sx={{ bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ pb: 1.5 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedWorkoutDetails.title}
                    </Typography>
                    {selectedWorkoutDetails.description && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {selectedWorkoutDetails.description}
                      </Typography>
                    )}
                  </Box>
                  {selectedWorkoutDetails.blocks && selectedWorkoutDetails.blocks.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.75, display: "block" }}>
                        Blocks: {selectedWorkoutDetails.blocks.map((b: any) => b.block_type).join(", ")}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {selectedWorkoutDetails.blocks.length} sections
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Time/Duration/Date selectors for non-editing flows */}
          {!editingActivity && (
            <Stack spacing={1.5}>
              <TextField
                type="time"
                label="Start Time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                type="number"
                label="Duration (minutes)"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 5, step: 5 }}
              />

              <TextField
                label="Date"
                value={selectedDay || ""}
                fullWidth
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!creatingWorkout && editingActivity && (
          <Button
            onClick={() => deleteMutation.mutate()}
            color="error"
            disabled={isLoading}
            sx={{ mr: "auto" }}
          >
            Delete
          </Button>
        )}
        {!creatingWorkout && editingActivity && activityType === "workout" && selectedWorkoutDetails && (
          <Button
            component="a"
            href={`/workouts/${selectedWorkoutDetails.slug}`}
            target="_blank"
            rel="noopener"
            disabled={isLoading}
          >
            Edit Workout
          </Button>
        )}
        <Button 
          onClick={() => {
            if (creatingWorkout) {
              setCreatingWorkout(false);
              setError("");
            } else {
              onClose();
            }
          }}
          disabled={isLoading}
        >
          {creatingWorkout ? "Back" : "Cancel"}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{
            bgcolor: activityType === "quick_training" ? "info.main" : "success.main",
          }}
        >
          {creatingWorkout
            ? "Create Workout"
            : editingActivity
            ? "Update"
            : "Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
