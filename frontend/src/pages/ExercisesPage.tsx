import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/api/client";
import type { Exercise, ExerciseMedia, MartialStyle, BodyPart, Equipment, PaginatedResponse } from "@/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import BodyMap from "@/components/BodyMap";

function ExerciseThumbnail({ media, title }: { media?: ExerciseMedia[]; title: string }) {
  const first = media?.[0];

  if (!first) {
    return (
      <Box
        sx={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
        }}
      >
        <FitnessCenterIcon sx={{ fontSize: 48, color: "grey.400" }} />
      </Box>
    );
  }

  if (first.media_type === "video") {
    return (
      <Box sx={{ height: 180, overflow: "hidden", bgcolor: "black" }}>
        <video
          src={first.file_url}
          poster={first.thumbnail_url || undefined}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
    );
  }

  if (first.media_type === "gif") {
    return (
      <Box
        component="img"
        src={first.file_url}
        alt={title}
        sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
      />
    );
  }

  // image
  return (
    <Box
      component="img"
      src={first.thumbnail_url || first.file_url}
      alt={title}
      sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
    />
  );
}

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equip, setEquip] = useState("");
  const [page, setPage] = useState(1);

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

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (style) params.set("style", style);
  if (difficulty) params.set("difficulty", difficulty);
  if (bodyPart) params.set("body_part", bodyPart);
  if (equip) params.set("equipment", equip);
  params.set("page", String(page));

  const { data, isLoading } = useQuery<PaginatedResponse<Exercise>>({
    queryKey: ["exercises", search, style, difficulty, bodyPart, equip, page],
    queryFn: () => api.get(`/exercises/?${params}`).then((r) => r.data),
  });

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1,
        }}
      >
        <Typography variant="h4">Exercises</Typography>
        <Button
          component={Link}
          to="/exercises/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Exercise
        </Button>
      </Box>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <TextField
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={{ minWidth: { md: 220 } }}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: "auto" }}>
          <TextField
            select
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={{ minWidth: { md: 160 } }}
            label="Style"
            size="small"
          >
            <MenuItem value="">All Styles</MenuItem>
            {styles?.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: "auto" }}>
          <TextField
            select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={{ minWidth: { md: 160 } }}
            label="Level"
            size="small"
          >
            <MenuItem value="">All Levels</MenuItem>
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: "auto" }}>
          <TextField
            select
            value={bodyPart}
            onChange={(e) => {
              setBodyPart(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={{ minWidth: { md: 160 } }}
            label="Muscle Group"
            size="small"
          >
            <MenuItem value="">All Muscle Groups</MenuItem>
            {bodyParts?.map((bp) => (
              <MenuItem key={bp.slug} value={bp.slug}>
                {bp.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: "auto" }}>
          <TextField
            select
            value={equip}
            onChange={(e) => {
              setEquip(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={{ minWidth: { md: 160 } }}
            label="Equipment"
            size="small"
          >
            <MenuItem value="">All Equipment</MenuItem>
            {equipmentList?.map((eq) => (
              <MenuItem key={eq.slug} value={eq.slug}>
                {eq.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {data?.results?.map((exercise) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={exercise.id}>
                <Card
                  component={Link}
                  to={`/exercises/${exercise.slug}`}
                  sx={{
                    textDecoration: "none",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": { boxShadow: 4 },
                    transition: "box-shadow 0.2s",
                    overflow: "hidden",
                  }}
                >
                  <ExerciseThumbnail media={exercise.media} title={exercise.title} />
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {exercise.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 1.5,
                          }}
                        >
                          {exercise.short_description}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip label={exercise.difficulty_level} size="small" />
                          {exercise.primary_style_name && (
                            <Chip label={exercise.primary_style_name} size="small" color="success" />
                          )}
                        </Stack>
                      </Box>
                      {exercise.body_part_slugs && exercise.body_part_slugs.length > 0 && (
                        <Box sx={{ flexShrink: 0 }}>
                          <BodyMap activeSlugs={exercise.body_part_slugs} height={100} showLabels={false} />
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {data && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {data.count} exercises found
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
