import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, Notification } from "@/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Notification>>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications/?ordering=-created_at").then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/`, { read_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">
          Notifications{unreadCount > 0 && ` (${unreadCount})`}
        </Typography>
        {unreadCount > 0 && (
          <Button
            startIcon={<MarkEmailReadIcon />}
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark All Read
          </Button>
        )}
      </Stack>

      {notifications.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={8}>
          No notifications.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {notifications.map((n) => (
            <Card
              key={n.id}
              sx={{
                bgcolor: n.read_at ? "background.paper" : "action.hover",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <Box>
                  <Typography fontWeight={n.read_at ? 400 : 600}>
                    {n.title}
                  </Typography>
                  {n.body && (
                    <Typography variant="body2" color="text.secondary">
                      {n.body}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.created_at).toLocaleString()}
                  </Typography>
                </Box>
                {!n.read_at && (
                  <Button
                    size="small"
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                  >
                    Mark Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
