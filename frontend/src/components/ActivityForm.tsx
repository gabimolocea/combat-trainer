import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  Link,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    training_type: "",
    workout: "",
    start_time: "09:00",
    duration_minutes: 30,
  });
  const [error, setError] = useState("");
  const [creatingWorkout, setCreatingWorkout] = useState(false);

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
  
  const { data: selectedWorkoutDetails } = useQuery<Workout>({
    queryKey: ["workout-details", workoutId],
    queryFn: () => {
      if (!workoutId) return Promise.reject("No workout ID");
      return api.get(`/workouts/${workoutId}/`).then((r) => r.data);
    },
    enabled: !!workoutId && activityType === "workout",
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
      // Navigate to workout builder - user will create there and come back
      navigate("/workout-builder", {
        state: { returnToDays: selectedDay, returnToCalendar: true },
      });
      return Promise.resolve();
    },
  });

  const handleSubmit = () => {
    // Validation
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
  };

  const isLoading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || createWorkoutMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingActivity
          ? "Edit Activity"
          : `Schedule ${activityType === "quick_training" ? "Quick Training" : "Workout"}`}
      </DialogTitle>
      <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Activity Type Selector */}
          {activityType === "quick_training" ? (
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
          ) : creatingWorkout ? (
            // Navigate to full workout builder
            <Stack spacing={2} sx={{ textAlign: "center", py: 3 }}>
              <Alert severity="info">
                You'll be taken to the full Workout Builder where you can add exercises, organize blocks, and create a complete workout.
              </Alert>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => createWorkoutMutation.mutate()}
                  fullWidth
                >
                  Open Workout Builder
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCreatingWorkout(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : (
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

          {/* Workout Details Display */}
          {selectedWorkoutDetails && (
            <Card sx={{ bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ pb: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Workout"
                          value={selectedWorkoutDetails.title}
                          fullWidth
                          disabled
                          size="small"
                          variant="standard"
                        />
                      </Box>
                      {editingActivity && (
                        <Link
                          href={`/workouts/${selectedWorkoutDetails.slug}`}
                          target="_blank"
                          rel="noopener"
                          sx={{ cursor: "pointer", ml: 1, whiteSpace: "nowrap", mt: 1 }}
                        >
                          View Full →
                        </Link>
                      )}
                    </Box>
                  </Box>
                  {selectedWorkoutDetails.description && (
                    <TextField
                      label="Description"
                      value={selectedWorkoutDetails.description}
                      fullWidth
                      disabled
                      multiline
                      rows={2}
                      size="small"
                      variant="filled"
                    />
                  )}
                  {selectedWorkoutDetails.difficulty_level && (
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <TextField
                        label="Difficulty"
                        value={selectedWorkoutDetails.difficulty_level}
                        fullWidth
                        disabled
                        size="small"
                        variant="filled"
                        sx={{ flex: 1, minWidth: 150 }}
                      />
                      {selectedWorkoutDetails.estimated_duration_minutes && (
                        <TextField
                          label="Est. Duration (min)"
                          value={selectedWorkoutDetails.estimated_duration_minutes}
                          fullWidth
                          disabled
                          size="small"
                          variant="filled"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                      )}
                    </Box>
                  )}
                  
                  {/* Workout Blocks and Exercises */}
                  {selectedWorkoutDetails.blocks && selectedWorkoutDetails.blocks.length > 0 && (
                    <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Workout Structure
                      </Typography>
                      <Stack spacing={1.5}>
                        {selectedWorkoutDetails.blocks.map((block: any, blockIdx: number) => (
                          <Card
                            key={blockIdx}
                            variant="outlined"
                            sx={{
                              bgcolor: "background.default",
                              p: 1.5,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "inline-block",
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontWeight: 600,
                                  mb: 0.5,
                                }}
                              >
                                {block.block_type.toUpperCase()}
                              </Typography>
                              {block.title && (
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                                  {block.title}
                                </Typography>
                              )}
                            </Box>
                            {block.exercises && block.exercises.length > 0 && (
                              <Stack spacing={0.75}>
                                {block.exercises.map((exercise: any, exIdx: number) => (
                                  <Box
                                    key={exIdx}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      p: 0.75,
                                      bgcolor: "background.paper",
                                      borderRadius: 1,
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                        {exercise.exercise_title}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1.5,
                                        ml: 1,
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                      }}
                                    >
                                      {exercise.sets && (
                                        <Box>{exercise.sets}x</Box>
                                      )}
                                      {exercise.reps && (
                                        <Box>{exercise.reps}r</Box>
                                      )}
                                      {exercise.work_seconds && (
                                        <Box>{exercise.work_seconds}s</Box>
                                      )}
                                      {exercise.rest_seconds && (
                                        <Box>R:{exercise.rest_seconds}s</Box>
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                            {block.notes && (
                              <Typography variant="caption" sx={{ display: "block", mt: 0.75, fontStyle: "italic", color: "text.secondary" }}>
                                {block.notes}
                              </Typography>
                            )}
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Time Selector */}
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

          {/* Duration Selector */}
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

          {/* Date Display */}
          <TextField
            label="Date"
            value={selectedDay || ""}
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        {editingActivity && (
          <Button
            onClick={() => deleteMutation.mutate()}
            color="error"
            disabled={isLoading}
            sx={{ mr: "auto" }}
          >
            Delete
          </Button>
        )}
        {editingActivity && activityType === "workout" && selectedWorkoutDetails && (
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
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{
            bgcolor: activityType === "quick_training" ? "info.main" : "success.main",
          }}
        >
          {editingActivity ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
