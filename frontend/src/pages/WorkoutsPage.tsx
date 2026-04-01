import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, Workout, MartialStyle, BodyPart, Equipment } from "@/types";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

/* ─── Shared workout card ─── */
function WorkoutCard({
  workout,
  onToggleBookmark,
}: {
  workout: Workout;
  onToggleBookmark: (w: Workout) => void;
}) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="h6"
            component={RouterLink}
            to={`/workouts/${workout.slug}`}
            sx={{ textDecoration: "none", color: "inherit" }}
          >
            {workout.title}
          </Typography>
          <IconButton size="small" onClick={() => onToggleBookmark(workout)}>
            {workout.is_bookmarked ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
          </IconButton>
        </Stack>
        {workout.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {workout.description.slice(0, 120)}
            {workout.description.length > 120 ? "…" : ""}
          </Typography>
        )}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Chip label={workout.difficulty_level} size="small" />
          {workout.estimated_duration_minutes && (
            <Chip label={`${workout.estimated_duration_minutes} min`} size="small" variant="outlined" />
          )}
          {workout.primary_style_name && (
            <Chip label={workout.primary_style_name} size="small" variant="outlined" />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          by {workout.created_by.username}
        </Typography>
      </CardContent>
    </Card>
  );
}

/* ─── Workout list panel ─── */
function WorkoutList({ owner }: { owner: "mine" | "community" }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Workout>>({
    queryKey: ["workouts", owner, page, search],
    queryFn: () =>
      api
        .get("/workouts/", { params: { page, search: search || undefined, owner } })
        .then((r) => r.data),
  });

  const toggleBookmark = useMutation({
    mutationFn: (w: Workout) =>
      w.is_bookmarked
        ? api.delete(`/workouts/${w.slug}/bookmark/`)
        : api.post(`/workouts/${w.slug}/bookmark/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });

  return (
    <Stack spacing={2}>
      <TextField
        placeholder="Search workouts…"
        fullWidth
        size="small"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !data?.results?.length ? (
        <Typography color="text.secondary" textAlign="center" py={6}>
          {owner === "mine" ? "You haven't created any workouts yet." : "No community workouts found."}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {data.results.map((w) => (
            <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <WorkoutCard workout={w} onToggleBookmark={(w) => toggleBookmark.mutate(w)} />
            </Grid>
          ))}
        </Grid>
      )}

      {data && data.count > 10 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(data.count / 10)}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </Box>
      )}
    </Stack>
  );
}

/* ─── AI Generator panel ─── */
const GOALS = [
  { value: "general_fitness", label: "General Fitness" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "technique", label: "Technique" },
  { value: "weight_loss", label: "Weight Loss" },
];

function WorkoutGenerator() {
  const navigate = useNavigate();
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("general_fitness");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [duration, setDuration] = useState("45");

  const { data: styles } = useQuery<MartialStyle[]>({
    queryKey: ["styles"],
    queryFn: () => api.get("/taxonomy/styles/").then((r) => r.data.results ?? r.data),
  });
  const { data: bodyParts } = useQuery<BodyPart[]>({
    queryKey: ["body-parts"],
    queryFn: () => api.get("/taxonomy/body-parts/").then((r) => r.data.results ?? r.data),
  });
  const { data: equipmentList } = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: () => api.get("/taxonomy/equipment/").then((r) => r.data.results ?? r.data),
  });

  const generate = useMutation({
    mutationFn: () =>
      api.post("/workouts/generate/", {
        gender,
        age: age ? Number(age) : null,
        goal,
        fitness_level: fitnessLevel,
        equipment: selectedEquipment,
        muscles: selectedMuscles,
        style: selectedStyle,
        duration: Number(duration) || 45,
      }),
    onSuccess: (res) => {
      navigate(`/workouts/${res.data.slug}`);
    },
  });

  const toggleChip = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ borderRadius: 2 }}>
        Fill in your criteria and we'll generate a personalized workout for you.
      </Alert>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            fullWidth
            label="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            inputProps={{ min: 10, max: 99 }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            fullWidth
            label="Duration (min)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            inputProps={{ min: 10, max: 120 }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            {GOALS.map((g) => (
              <MenuItem key={g.value} value={g.value}>
                {g.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Fitness Level"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value)}
          >
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Martial Art Style"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            <MenuItem value="">Any Style</MenuItem>
            {styles?.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Muscle groups chips */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Target Muscles
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {bodyParts?.map((bp) => (
            <Chip
              key={bp.slug}
              label={bp.name}
              size="small"
              variant={selectedMuscles.includes(bp.slug) ? "filled" : "outlined"}
              color={selectedMuscles.includes(bp.slug) ? "primary" : "default"}
              onClick={() => toggleChip(bp.slug, selectedMuscles, setSelectedMuscles)}
            />
          ))}
        </Stack>
      </Box>

      {/* Equipment chips */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Available Equipment
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {equipmentList?.map((eq) => (
            <Chip
              key={eq.slug}
              label={eq.name}
              size="small"
              variant={selectedEquipment.includes(eq.slug) ? "filled" : "outlined"}
              color={selectedEquipment.includes(eq.slug) ? "primary" : "default"}
              onClick={() => toggleChip(eq.slug, selectedEquipment, setSelectedEquipment)}
            />
          ))}
        </Stack>
      </Box>

      <Button
        variant="contained"
        size="large"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => generate.mutate()}
        disabled={generate.isPending}
        sx={{ alignSelf: "flex-start" }}
      >
        {generate.isPending ? "Generating…" : "Generate Workout"}
      </Button>

      {generate.isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {(generate.error as any)?.response?.data?.detail ?? "Failed to generate workout. Try different criteria."}
        </Alert>
      )}
    </Stack>
  );
}

/* ─── Main page ─── */
export default function WorkoutsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1}
      >
        <Typography variant="h4">Workouts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/workouts/new"
        >
          New Workout
        </Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
        }}
      >
        <Tab label="My Workouts" />
        <Tab label="Community" />
        <Tab label="Generator" icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {tab === 0 && <WorkoutList owner="mine" />}
      {tab === 1 && <WorkoutList owner="community" />}
      {tab === 2 && <WorkoutGenerator />}
    </Stack>
  );
}
