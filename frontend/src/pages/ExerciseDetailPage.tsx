import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import type { Exercise } from "@/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ExerciseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ["exercise", slug],
    queryFn: () => api.get(`/exercises/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (!exercise)
    return (
      <Typography color="text.secondary">Exercise not found.</Typography>
    );

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <Button
        component={Link}
        to="/exercises"
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        Back to exercises
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4">{exercise.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {exercise.short_description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={exercise.difficulty_level} />
          {exercise.primary_style_name && (
            <Chip label={exercise.primary_style_name} color="success" />
          )}
          {user && exercise.created_by?.id === user.id && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/exercises/${slug}/edit`)}
            >
              Edit
            </Button>
          )}
        </Stack>
      </Box>

      {exercise.media?.length > 0 && (
        <Box
          sx={{
            aspectRatio: "16/9",
            bgcolor: "grey.900",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {exercise.media[0].media_type === "video" ? (
            <video
              src={exercise.media[0].file_url}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <img
              src={exercise.media[0].file_url}
              alt={exercise.title}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            {exercise.instructions && (
              <Card>
                <CardHeader title="Starting Position" titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }} />
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {exercise.instructions}
                  </Typography>
                </CardContent>
              </Card>
            )}
            {exercise.full_description && (
              <Card>
                <CardHeader title="Action" titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }} />
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {exercise.full_description}
                  </Typography>
                </CardContent>
              </Card>
            )}
            {exercise.common_mistakes && (
              <Card>
                <CardHeader title="Common Mistakes" titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }} />
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {exercise.common_mistakes}
                  </Typography>
                </CardContent>
              </Card>
            )}
            {exercise.safety_notes && (
              <Card>
                <CardHeader title="Tips" titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }} />
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {exercise.safety_notes}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardHeader title="Primary Muscle Groups" titleTypographyProps={{ variant: "subtitle2" }} />
              <CardContent>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {exercise.muscle_groups.map((mg: { id: number; name: string; slug: string } | number) => {
                    const name = typeof mg === "object" ? mg.name : String(mg);
                    const key = typeof mg === "object" ? mg.id : mg;
                    return <Chip key={key} label={name} size="small" />;
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Details" titleTypographyProps={{ variant: "subtitle2" }} />
            <CardContent>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created by
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {exercise.created_by.username}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Added
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(exercise.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
