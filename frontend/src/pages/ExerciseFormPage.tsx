import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
}

interface ExerciseFormData {
  title: string;
  short_description: string;
  full_description: string;
  instructions: string;
  common_mistakes: string;
  safety_notes: string;
  difficulty_level: string;
  is_public: boolean;
  primary_style: number | null;
  workout_types: number[];
  muscle_groups: number[];
  equipment_required: number[];
  tags: number[];
}

const emptyForm: ExerciseFormData = {
  title: "",
  short_description: "",
  full_description: "",
  instructions: "",
  common_mistakes: "",
  safety_notes: "",
  difficulty_level: "beginner",
  is_public: false,
  primary_style: null,
  workout_types: [],
  muscle_groups: [],
  equipment_required: [],
  tags: [],
};

export default function ExerciseFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = Boolean(slug);

  const [form, setForm] = useState<ExerciseFormData>(emptyForm);
  const [error, setError] = useState("");

  const { data: styles } = useQuery<TaxonomyItem[]>({
    queryKey: ["martial-styles"],
    queryFn: () => api.get("/taxonomy/styles/?page_size=100").then((r) => r.data.results ?? r.data),
  });

  const { data: workoutTypes } = useQuery<TaxonomyItem[]>({
    queryKey: ["workout-types"],
    queryFn: () => api.get("/taxonomy/workout-types/?page_size=100").then((r) => r.data.results ?? r.data),
  });

  const { data: muscleGroups } = useQuery<TaxonomyItem[]>({
    queryKey: ["muscle-groups"],
    queryFn: () => api.get("/taxonomy/muscle-groups/?page_size=100").then((r) => r.data.results ?? r.data),
  });

  const { data: equipment } = useQuery<TaxonomyItem[]>({
    queryKey: ["equipment"],
    queryFn: () => api.get("/taxonomy/equipment/?page_size=100").then((r) => r.data.results ?? r.data),
  });

  const { data: tags } = useQuery<TaxonomyItem[]>({
    queryKey: ["tags"],
    queryFn: () => api.get("/taxonomy/tags/?page_size=100").then((r) => r.data.results ?? r.data),
  });

  const { data: existingExercise } = useQuery({
    queryKey: ["exercise", slug],
    queryFn: () => api.get(`/exercises/${slug!}/`).then((r) => r.data),
    enabled: !!slug,
  });

  useEffect(() => {
    if (existingExercise) {
      setForm({
        title: existingExercise.title ?? "",
        short_description: existingExercise.short_description ?? "",
        full_description: existingExercise.full_description ?? "",
        instructions: existingExercise.instructions ?? "",
        common_mistakes: existingExercise.common_mistakes ?? "",
        safety_notes: existingExercise.safety_notes ?? "",
        difficulty_level: existingExercise.difficulty_level ?? "beginner",
        is_public: existingExercise.is_public ?? false,
        primary_style: existingExercise.primary_style ?? null,
        workout_types: existingExercise.workout_types ?? [],
        muscle_groups: existingExercise.muscle_groups ?? [],
        equipment_required: existingExercise.equipment_required ?? [],
        tags: existingExercise.tags ?? [],
      });
    }
  }, [existingExercise]);

  const createExercise = useMutation({
    mutationFn: (data: ExerciseFormData) => api.post("/exercises/", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      navigate(`/exercises/${res.data.slug}`);
    },
    onError: () => setError("Failed to create exercise."),
  });

  const updateExercise = useMutation({
    mutationFn: (data: ExerciseFormData) => api.patch(`/exercises/${slug}/`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise", slug] });
      navigate(`/exercises/${res.data.slug}`);
    },
    onError: () => setError("Failed to update exercise."),
  });

  const handleSubmit = (publish: boolean) => {
    setError("");
    const payload = { ...form, is_public: publish };
    if (isEdit) {
      updateExercise.mutate(payload);
    } else {
      createExercise.mutate(payload);
    }
  };

  const setField = <K extends keyof ExerciseFormData>(key: K, value: ExerciseFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleM2M = (
    field: "workout_types" | "muscle_groups" | "equipment_required" | "tags",
    id: number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((v) => v !== id)
        : [...prev[field], id],
    }));
  };

  const isSaving = createExercise.isPending || updateExercise.isPending;

  return (
    <Stack spacing={3} sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4">{isEdit ? "Edit Exercise" : "Create Exercise"}</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Title"
              fullWidth
              required
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
            <TextField
              label="Short Description"
              fullWidth
              value={form.short_description}
              onChange={(e) => setField("short_description", e.target.value)}
              inputProps={{ maxLength: 300 }}
            />
            <TextField
              select
              label="Difficulty Level"
              fullWidth
              value={form.difficulty_level}
              onChange={(e) => setField("difficulty_level", e.target.value)}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="expert">Expert</MenuItem>
            </TextField>
            <TextField
              select
              label="Primary Style"
              fullWidth
              value={form.primary_style ?? ""}
              onChange={(e) =>
                setField("primary_style", e.target.value ? Number(e.target.value) : null)
              }
            >
              <MenuItem value="">— None —</MenuItem>
              {styles?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Introduction
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Starting Position"
              fullWidth
              multiline
              rows={3}
              value={form.instructions}
              onChange={(e) => setField("instructions", e.target.value)}
              placeholder="Describe the starting position..."
            />
            <TextField
              label="Action"
              fullWidth
              multiline
              rows={5}
              value={form.full_description}
              onChange={(e) => setField("full_description", e.target.value)}
              placeholder="Describe the movement and action..."
            />
            <TextField
              label="Tips"
              fullWidth
              multiline
              rows={3}
              value={form.safety_notes}
              onChange={(e) => setField("safety_notes", e.target.value)}
              placeholder="Key tips and cues..."
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Classification
          </Typography>
          <Stack spacing={3}>
            <ChipGroup
              label="Workout Types"
              items={workoutTypes ?? []}
              selected={form.workout_types}
              onToggle={(id) => toggleM2M("workout_types", id)}
            />
            <ChipGroup
              label="Primary Muscle Groups"
              items={muscleGroups ?? []}
              selected={form.muscle_groups}
              onToggle={(id) => toggleM2M("muscle_groups", id)}
            />
            <ChipGroup
              label="Machine Types"
              items={equipment ?? []}
              selected={form.equipment_required}
              onToggle={(id) => toggleM2M("equipment_required", id)}
            />
            <ChipGroup
              label="Tags"
              items={tags ?? []}
              selected={form.tags}
              onToggle={(id) => toggleM2M("tags", id)}
            />
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          onClick={() => handleSubmit(true)}
          disabled={isSaving || !form.title.trim()}
        >
          {isEdit ? "Update & Publish" : "Publish"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleSubmit(false)}
          disabled={isSaving || !form.title.trim()}
        >
          {isEdit ? "Save Draft" : "Save as Draft"}
        </Button>
        <Button onClick={() => navigate(-1)}>Cancel</Button>
      </Stack>
    </Stack>
  );
}

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: TaxonomyItem[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No options available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" fontWeight={500} gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <Chip
              key={item.id}
              label={item.name}
              onClick={() => onToggle(item.id)}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
