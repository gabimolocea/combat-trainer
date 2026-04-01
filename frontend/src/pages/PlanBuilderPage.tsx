import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, Workout } from "@/types";
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

export default function PlanBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [weeks, setWeeks] = useState<WeekForm[]>([]);
  const [error, setError] = useState("");

  const { data: workoutsData } = useQuery<PaginatedResponse<Workout>>({
    queryKey: ["workouts-all"],
    queryFn: () => api.get("/workouts/?page_size=200").then((r) => r.data),
  });
  const workouts = workoutsData?.results ?? [];

  const createPlan = useMutation({
    mutationFn: (payload: any) => api.post("/plans/", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      navigate(`/plans/${res.data.id}`);
    },
    onError: () => setError("Failed to create plan."),
  });

  const addWeek = () => {
    setWeeks((prev) => [
      ...prev,
      { week_number: prev.length + 1, title: "", notes: "", days: [] },
    ]);
  };

  const removeWeek = (idx: number) => {
    setWeeks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateWeek = <K extends keyof WeekForm>(idx: number, key: K, value: WeekForm[K]) => {
    setWeeks((prev) => prev.map((w, i) => (i === idx ? { ...w, [key]: value } : w)));
  };

  const addDay = (weekIdx: number) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === weekIdx
          ? {
              ...w,
              days: [
                ...w.days,
                { day_number: w.days.length + 1, title: "", workout: null, notes: "" },
              ],
            }
          : w
      )
    );
  };

  const removeDay = (weekIdx: number, dayIdx: number) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === weekIdx ? { ...w, days: w.days.filter((_, j) => j !== dayIdx) } : w
      )
    );
  };

  const updateDay = (weekIdx: number, dayIdx: number, field: keyof DayForm, value: any) => {
    setWeeks((prev) =>
      prev.map((w, i) =>
        i === weekIdx
          ? {
              ...w,
              days: w.days.map((d, j) =>
                j === dayIdx ? { ...d, [field]: value } : d
              ),
            }
          : w
      )
    );
  };

  const handleSubmit = () => {
    setError("");
    const payload = {
      title,
      description,
      difficulty_level: difficultyLevel,
      duration_weeks: weeks.length,
      weeks: weeks.map((w, wi) => ({
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
    };
    createPlan.mutate(payload);
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4">Build a Training Plan</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Plan Title"
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
          </Stack>
        </CardContent>
      </Card>

      {weeks.map((week, wi) => (
        <Card key={wi}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Week {wi + 1}</Typography>
              <IconButton color="error" size="small" onClick={() => removeWeek(wi)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
            <Stack spacing={2}>
              <TextField
                label="Week Title"
                fullWidth
                value={week.title}
                onChange={(e) => updateWeek(wi, "title", e.target.value)}
              />
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={week.notes}
                onChange={(e) => updateWeek(wi, "notes", e.target.value)}
              />

              <Typography variant="subtitle2" mt={1}>
                Days
              </Typography>

              {week.days.map((day, di) => (
                <Box
                  key={di}
                  sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={500} sx={{ minWidth: 60 }}>
                        Day {di + 1}
                      </Typography>
                      <TextField
                        label="Title"
                        size="small"
                        fullWidth
                        value={day.title}
                        onChange={(e) => updateDay(wi, di, "title", e.target.value)}
                      />
                      <TextField
                        select
                        label="Workout"
                        size="small"
                        sx={{ minWidth: 200 }}
                        value={day.workout ?? ""}
                        onChange={(e) =>
                          updateDay(
                            wi,
                            di,
                            "workout",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      >
                        <MenuItem value="">— Rest Day —</MenuItem>
                        {workouts.map((w) => (
                          <MenuItem key={w.id} value={w.id}>
                            {w.title}
                          </MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeDay(wi, di)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}

              <Button size="small" startIcon={<AddIcon />} onClick={() => addDay(wi)}>
                Add Day
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Button variant="outlined" startIcon={<AddIcon />} onClick={addWeek}>
        Add Week
      </Button>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createPlan.isPending || !title.trim()}
        >
          Create Plan
        </Button>
        <Button onClick={() => navigate(-1)}>Cancel</Button>
      </Stack>
    </Stack>
  );
}
