import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, PartnerRelation, FollowRelation } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function SocialPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteUsername, setInviteUsername] = useState("");
  const [followUsername, setFollowUsername] = useState("");
  const [error, setError] = useState("");

  const { data: partners, isLoading: loadingPartners } = useQuery<
    PaginatedResponse<PartnerRelation>
  >({
    queryKey: ["partners"],
    queryFn: () => api.get("/social/partners/").then((r) => r.data),
  });

  const { data: followers } = useQuery<PaginatedResponse<FollowRelation>>({
    queryKey: ["followers"],
    queryFn: () => api.get("/social/followers/").then((r) => r.data),
  });

  const { data: following } = useQuery<PaginatedResponse<FollowRelation>>({
    queryKey: ["following"],
    queryFn: () => api.get("/social/following/").then((r) => r.data),
  });

  const invitePartner = useMutation({
    mutationFn: () =>
      api.post("/social/partners/", { addressee_username: inviteUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setInviteUsername("");
      setError("");
    },
    onError: () => setError("Failed to send invite."),
  });

  const respondPartner = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "declined" }) =>
      api.patch(`/social/partners/${id}/`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });

  const followUser = useMutation({
    mutationFn: () =>
      api.post("/social/follow/", { followed_username: followUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      setFollowUsername("");
      setError("");
    },
    onError: () => setError("Failed to follow user."),
  });

  const unfollowUser = useMutation({
    mutationFn: (id: number) => api.delete(`/social/follow/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["following"] }),
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Social</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Training Partners */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Training Partners
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              placeholder="Username to invite…"
              size="small"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => invitePartner.mutate()}
              disabled={invitePartner.isPending || !inviteUsername.trim()}
            >
              Invite
            </Button>
          </Stack>

          {loadingPartners ? (
            <CircularProgress size={24} />
          ) : !partners?.results?.length ? (
            <Typography variant="body2" color="text.secondary">
              No training partners yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {partners.results.map((p) => {
                const other =
                  p.requester.username === user?.username ? p.addressee : p.requester;
                const isPending = p.status === "pending";
                const isIncoming = p.addressee.username === user?.username && isPending;

                return (
                  <Box
                    key={p.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={500}>{other.username}</Typography>
                      <Chip
                        label={p.status}
                        size="small"
                        color={
                          p.status === "accepted"
                            ? "success"
                            : p.status === "pending"
                            ? "warning"
                            : "default"
                        }
                      />
                    </Stack>
                    {isIncoming && (
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() =>
                            respondPartner.mutate({ id: p.id, status: "accepted" })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() =>
                            respondPartner.mutate({ id: p.id, status: "declined" })
                          }
                        >
                          Decline
                        </Button>
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Divider />

      {/* Following */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Following
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              placeholder="Username to follow…"
              size="small"
              value={followUsername}
              onChange={(e) => setFollowUsername(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => followUser.mutate()}
              disabled={followUser.isPending || !followUsername.trim()}
            >
              Follow
            </Button>
          </Stack>

          {!following?.results?.length ? (
            <Typography variant="body2" color="text.secondary">
              Not following anyone yet.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {following.results.map((f) => (
                <Chip
                  key={f.id}
                  label={f.followed_user.username}
                  onDelete={() => unfollowUser.mutate(f.id)}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Followers */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Followers
          </Typography>
          {!followers?.results?.length ? (
            <Typography variant="body2" color="text.secondary">
              No followers yet.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {followers.results.map((f) => (
                <Chip key={f.id} label={f.follower.username} variant="outlined" />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
