import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, Exercise } from "@/types";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface BlockForm {
  block_type: string;
  title: string;
  notes: string;
  sort_order: number;
  exercises: ExerciseEntry[];
}

interface ExerciseEntry {
  exercise: number;
  exercise_title: string;
  sort_order: number;
  reps: number | null;
  sets: number | null;
  work_seconds: number | null;
  rest_seconds: number | null;
  notes: string;
}

const BLOCK_TYPES = ["warmup", "technique", "rounds", "conditioning", "cooldown"];

export default function WorkoutBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">("");
  const [blocks, setBlocks] = useState<BlockForm[]>([]);
  const [error, setError] = useState("");

  const { data: exercisesData } = useQuery<PaginatedResponse<Exercise>>({
    queryKey: ["exercises-all"],
    queryFn: () => api.get("/exercises/?page_size=200").then((r) => r.data),
  });
  const exercises = exercisesData?.results ?? [];

  const createWorkout = useMutation({
    mutationFn: (payload: any) => api.post("/workouts/", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      navigate(`/workouts/${res.data.slug}`);
    },
    onError: () => setError("Failed to create workout."),
  });

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        block_type: "technique",
        title: "",
        notes: "",
        sort_order: prev.length + 1,
        exercises: [],
      },
    ]);
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBlock = <K extends keyof BlockForm>(idx: number, key: K, value: BlockForm[K]) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: value } : b)));
  };

  const addExerciseToBlock = (blockIdx: number) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
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
      )
    );
  };

  const removeExerciseFromBlock = (blockIdx: number, exIdx: number) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIdx
          ? { ...b, exercises: b.exercises.filter((_, j) => j !== exIdx) }
          : b
      )
    );
  };

  const updateExerciseEntry = (
    blockIdx: number,
    exIdx: number,
    field: keyof ExerciseEntry,
    value: any
  ) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              exercises: b.exercises.map((e, j) =>
                j === exIdx ? { ...e, [field]: value } : e
              ),
            }
          : b
      )
    );
  };

  const handleSubmit = () => {
    setError("");
    const payload = {
      title,
      description,
      difficulty_level: difficultyLevel,
      estimated_duration_minutes: estimatedDuration || null,
      blocks: blocks.map((b, bi) => ({
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
    createWorkout.mutate(payload);
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4">Build a Workout</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Workout Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Difficulty"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </TextField>
              <TextField
                label="Est. Duration (min)"
                type="number"
                value={estimatedDuration}
                onChange={(e) =>
                  setEstimatedDuration(e.target.value ? Number(e.target.value) : "")
                }
                inputProps={{ min: 0 }}
                sx={{ minWidth: 180 }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {blocks.map((block, bi) => (
        <Card key={bi}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Block {bi + 1}</Typography>
              <IconButton color="error" size="small" onClick={() => removeBlock(bi)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Block Type"
                  value={block.block_type}
                  onChange={(e) => updateBlock(bi, "block_type", e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  {BLOCK_TYPES.map((bt) => (
                    <MenuItem key={bt} value={bt}>
                      {bt}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Block Title"
                  fullWidth
                  value={block.title}
                  onChange={(e) => updateBlock(bi, "title", e.target.value)}
                />
              </Stack>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={block.notes}
                onChange={(e) => updateBlock(bi, "notes", e.target.value)}
              />

              <Typography variant="subtitle2" mt={1}>
                Exercises
              </Typography>

              {block.exercises.map((ex, ei) => (
                <Box
                  key={ei}
                  sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        select
                        label="Exercise"
                        fullWidth
                        value={ex.exercise || ""}
                        onChange={(e) =>
                          updateExerciseEntry(bi, ei, "exercise", Number(e.target.value))
                        }
                      >
                        <MenuItem value="">— Select —</MenuItem>
                        {exercises.map((exItem) => (
                          <MenuItem key={exItem.id} value={exItem.id}>
                            {exItem.title}
                          </MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeExerciseFromBlock(bi, ei)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Sets"
                        type="number"
                        size="small"
                        value={ex.sets ?? ""}
                        onChange={(e) =>
                          updateExerciseEntry(bi, ei, "sets", e.target.value ? Number(e.target.value) : null)
                        }
                        sx={{ width: 90 }}
                        inputProps={{ min: 0 }}
                      />
                      <TextField
                        label="Reps"
                        type="number"
                        size="small"
                        value={ex.reps ?? ""}
                        onChange={(e) =>
                          updateExerciseEntry(bi, ei, "reps", e.target.value ? Number(e.target.value) : null)
                        }
                        sx={{ width: 90 }}
                        inputProps={{ min: 0 }}
                      />
                      <TextField
                        label="Work (s)"
                        type="number"
                        size="small"
                        value={ex.work_seconds ?? ""}
                        onChange={(e) =>
                          updateExerciseEntry(bi, ei, "work_seconds", e.target.value ? Number(e.target.value) : null)
                        }
                        sx={{ width: 100 }}
                        inputProps={{ min: 0 }}
                      />
                      <TextField
                        label="Rest (s)"
                        type="number"
                        size="small"
                        value={ex.rest_seconds ?? ""}
                        onChange={(e) =>
                          updateExerciseEntry(bi, ei, "rest_seconds", e.target.value ? Number(e.target.value) : null)
                        }
                        sx={{ width: 100 }}
                        inputProps={{ min: 0 }}
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}

              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addExerciseToBlock(bi)}
              >
                Add Exercise
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Button variant="outlined" startIcon={<AddIcon />} onClick={addBlock}>
        Add Block
      </Button>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createWorkout.isPending || !title.trim()}
        >
          Create Workout
        </Button>
        <Button onClick={() => navigate(-1)}>Cancel</Button>
      </Stack>
    </Stack>
  );
}
