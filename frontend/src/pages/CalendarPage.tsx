import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { PaginatedResponse, CalendarEvent } from "@/types";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";


const EVENT_TYPES = [
  "workout",
  "plan_day",
  "custom_training",
  "partner_session",
  "rest_day",
] as const;

const EVENT_COLORS: Record<string, "primary" | "secondary" | "success" | "info" | "warning"> = {
  workout: "primary",
  plan_day: "info",
  custom_training: "secondary",
  partner_session: "success",
  rest_day: "warning",
};

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [openForm, setOpenForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<string>("custom_training");
  const [formDescription, setFormDescription] = useState("");
  const [error, setError] = useState("");

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const { data } = useQuery<PaginatedResponse<CalendarEvent>>({
    queryKey: ["calendar-events", year, month],
    queryFn: () =>
      api
        .get("/calendar/events/", {
          params: {
            starts_at__gte: startOfMonth.toISOString(),
            starts_at__lte: endOfMonth.toISOString(),
            page_size: 100,
          },
        })
        .then((r) => r.data),
  });

  const createEvent = useMutation({
    mutationFn: (payload: any) => api.post("/calendar/events/", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setOpenForm(false);
      resetForm();
    },
    onError: () => setError("Failed to create event."),
  });

  const resetForm = () => {
    setFormTitle("");
    setFormType("custom_training");
    setFormDescription("");
    setError("");
  };

  const handleOpenForm = (dateStr: string) => {
    setSelectedDate(dateStr);
    resetForm();
    setOpenForm(true);
  };

  const handleCreateEvent = () => {
    setError("");
    createEvent.mutate({
      title: formTitle,
      event_type: formType,
      description: formDescription,
      starts_at: `${selectedDate}T09:00:00Z`,
    });
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    data?.results?.forEach((ev) => {
      const d = ev.starts_at.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    });
    return map;
  }, [data]);

  // Build calendar grid
  const firstDayOfWeek = startOfMonth.getDay(); // 0=Sun
  const daysInMonth = endOfMonth.getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Calendar</Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton onClick={prevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 200, textAlign: "center" }}>
          {monthNames[month]} {year}
        </Typography>
        <IconButton onClick={nextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Box>
        <Grid container>
          {weekDays.map((d) => (
            <Grid key={d} size={{ xs: 12 / 7 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                textAlign="center"
                display="block"
                py={1}
              >
                {d}
              </Typography>
            </Grid>
          ))}
          {calendarCells.map((day, idx) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : "";
            const events = dateStr ? eventsByDate[dateStr] ?? [] : [];
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <Grid key={idx} size={{ xs: 12 / 7 }}>
                <Box
                  sx={{
                    minHeight: 90,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 0.5,
                    bgcolor: isToday ? "action.selected" : day ? "background.paper" : "action.disabledBackground",
                    cursor: day ? "pointer" : "default",
                  }}
                  onClick={() => day && handleOpenForm(dateStr)}
                >
                  {day && (
                    <>
                      <Typography variant="body2" fontWeight={isToday ? 700 : 400}>
                        {day}
                      </Typography>
                      <Stack spacing={0.25}>
                        {events.slice(0, 3).map((ev) => (
                          <Chip
                            key={ev.id}
                            label={ev.title}
                            size="small"
                            color={EVENT_COLORS[ev.event_type] || "default"}
                            sx={{ fontSize: "0.65rem", height: 20 }}
                          />
                        ))}
                        {events.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{events.length - 3} more
                          </Typography>
                        )}
                      </Stack>
                    </>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Create Event Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Event — {selectedDate}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Title"
              fullWidth
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <TextField
              select
              label="Event Type"
              fullWidth
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={createEvent.isPending || !formTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
