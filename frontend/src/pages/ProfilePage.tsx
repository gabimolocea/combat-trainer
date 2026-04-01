import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { UserProfile, PaginatedResponse } from "@/types";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => api.get("/profiles/me/").then((r) => r.data),
  });

  const { data: styles } = useQuery<PaginatedResponse<TaxonomyItem>>({
    queryKey: ["martial-styles"],
    queryFn: () => api.get("/taxonomy/styles/?page_size=100").then((r) => r.data),
  });

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    location_text: "",
    experience_level: "",
    weekly_availability: 0,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        location_text: profile.location_text ?? "",
        experience_level: profile.experience_level ?? "",
        weekly_availability: profile.weekly_availability ?? 0,
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data: typeof form) => api.patch("/profiles/me/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      setError("");
    },
    onError: () => setError("Failed to update profile."),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return <Typography color="error">Profile not found.</Typography>;
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 700, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Profile</Typography>
        {!editing && (
          <Button startIcon={<EditIcon />} onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center" mb={3}>
            <Avatar
              src={profile.avatar_url || undefined}
              sx={{ width: 80, height: 80, fontSize: 32 }}
            >
              {profile.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5">{profile.display_name || profile.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                @{profile.username}
              </Typography>
            </Box>
          </Stack>

          {editing ? (
            <Stack spacing={2}>
              <TextField
                label="Display Name"
                fullWidth
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
              <TextField
                label="Bio"
                fullWidth
                multiline
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
              <TextField
                label="Location"
                fullWidth
                value={form.location_text}
                onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))}
              />
              <TextField
                select
                label="Experience Level"
                fullWidth
                value={form.experience_level}
                onChange={(e) =>
                  setForm((f) => ({ ...f, experience_level: e.target.value }))
                }
              >
                <MenuItem value="">— Select —</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </TextField>
              <TextField
                label="Weekly Availability (hours)"
                type="number"
                fullWidth
                value={form.weekly_availability}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weekly_availability: Number(e.target.value) }))
                }
                inputProps={{ min: 0 }}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => updateProfile.mutate(form)}
                  disabled={updateProfile.isPending}
                >
                  Save
                </Button>
                <Button onClick={() => setEditing(false)}>Cancel</Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {profile.bio && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Bio
                  </Typography>
                  <Typography>{profile.bio}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Experience Level
                </Typography>
                <Typography sx={{ textTransform: "capitalize" }}>
                  {profile.experience_level || "Not set"}
                </Typography>
              </Box>
              {profile.location_text && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography>{profile.location_text}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Weekly Availability
                </Typography>
                <Typography>{profile.weekly_availability} hours/week</Typography>
              </Box>
              {profile.preferred_styles?.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Preferred Styles
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {profile.preferred_styles.map((sid) => {
                      const style = styles?.results?.find((s) => s.id === sid);
                      return (
                        <Chip
                          key={sid}
                          label={style?.name ?? `Style #${sid}`}
                          size="small"
                          variant="outlined"
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
