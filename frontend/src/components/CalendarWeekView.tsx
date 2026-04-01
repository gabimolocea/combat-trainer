import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { calendarAPI } from "@/api/calendar";
import type {
  ScheduledQuickTraining,
  ScheduledWorkout,
  CalendarDayData,
} from "@/types";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import ActivityForm from "./ActivityForm";

export default function CalendarWeekView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [formType, setFormType] = useState<"quick_training" | "workout" | null>(null);

  // Calculate month start and end
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Get all days from start of first week to end of last week
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch calendar data for the entire month
  const { data: monthData = {}, isLoading } = useQuery<Record<string, CalendarDayData>>({
    queryKey: ["calendar-month-grid", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      try {
        const response = await calendarAPI.getCalendarWeek({
          start_date: format(calendarStart, "yyyy-MM-dd"),
          num_days: Math.ceil((calendarEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        });
        // Convert array to object keyed by date
        return response.data.reduce((acc: Record<string, CalendarDayData>, day: CalendarDayData) => {
          acc[day.date] = day;
          return acc;
        }, {});
      } catch {
        return {};
      }
    },
  });

  const handlePrevMonth = () => {
    setCurrentDate((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleAddActivity = (date: string, type: "quick_training" | "workout") => {
    setSelectedDay(date);
    setFormType(type);
    setEditingActivity(null);
    setOpenForm(true);
  };

  const handleEditActivity = (activity: any, type: "quick_training" | "workout") => {
    setSelectedDay(activity.scheduled_date);
    setFormType(type);
    setEditingActivity({ ...activity, type });
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingActivity(null);
    setFormType(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Header with Month Navigation */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" sx={{ minWidth: 300, textAlign: "center", fontWeight: 700 }}>
          {format(currentDate, "MMMM yyyy")}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {/* Calendar Grid */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
            <Typography>Loading calendar...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: { xs: 0.25, sm: 0.5 }, p: { xs: 0.5, sm: 1 }, minHeight: "100%", width: "100%", boxSizing: "border-box" }}>
            {/* Day headers */}
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <Box key={`header-${day}`} sx={{ textAlign: "center", fontWeight: 700, pb: 0.5, fontSize: { xs: "0.7rem", sm: "0.9rem" }, overflow: "hidden", textOverflow: "ellipsis" }}>
                {day}
              </Box>
            ))}

            {/* Day cells */}
            {monthDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = monthData[dateStr];
              const isCurrentMonth = format(day, "M") === format(currentDate, "M");
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              const allActivities = [
                ...(dayData?.quick_trainings || []).map((a) => ({
                  ...a,
                  type: "quick_training" as const,
                })),
                ...(dayData?.workouts || []).map((a) => ({
                  ...a,
                  type: "workout" as const,
                })),
              ].sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <Box key={dateStr}>
                  <Card
                    sx={{
                      height: "100%",
                      minHeight: { xs: 80, sm: 120 },
                      bgcolor: !isCurrentMonth
                        ? "action.disabledBackground"
                        : isToday
                        ? "primary.light"
                        : "background.paper",
                      display: "flex",
                      flexDirection: "column",
                      border: isToday ? "2px solid" : "1px solid",
                      borderColor: isToday ? "primary.main" : "divider",
                    }}
                  >
                    <CardContent sx={{ p: 1, flex: 1, overflow: "auto", "&:last-child": { pb: 1 } }}>
                      {/* Date number */}
                      <Box sx={{ mb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.9rem" },
                            color: !isCurrentMonth ? "text.disabled" : isToday ? "primary.main" : "text.primary",
                          }}
                        >
                          {format(day, "d")}
                        </Typography>
                      </Box>

                      {/* Activities */}
                      <Stack spacing={0.25}>
                        {allActivities.slice(0, 2).map((activity) => {
                          const isQuickTraining = activity.type === "quick_training";
                          const title = isQuickTraining
                            ? (activity as ScheduledQuickTraining).training_type_name
                            : (activity as ScheduledWorkout).workout_title;

                          return (
                            <Card
                              key={`${activity.type}-${activity.id}`}
                              sx={{
                                bgcolor: isQuickTraining ? "info.light" : "success.light",
                                p: 0.5,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                "&:hover": { boxShadow: 1 },
                              }}
                              onClick={() => handleEditActivity(activity, activity.type)}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }} noWrap>
                                {activity.start_time}
                              </Typography>
                              <Typography variant="caption" noWrap>
                                {title}
                              </Typography>
                            </Card>
                          );
                        })}
                        {allActivities.length > 2 && (
                          <Typography variant="caption" color="textSecondary" sx={{ fontStyle: "italic" }}>
                            +{allActivities.length - 2} more
                          </Typography>
                        )}
                      </Stack>

                      {/* Add buttons */}
                      {isCurrentMonth && (
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          <Button
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => handleAddActivity(dateStr, "quick_training")}
                            sx={{ width: "100%", fontSize: { xs: "0.65rem", sm: "0.7rem" }, py: { xs: 0.15, sm: 0.25 } }}
                          >
                            +QT
                          </Button>
                          <Button
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => handleAddActivity(dateStr, "workout")}
                            sx={{ width: "100%", fontSize: { xs: "0.65rem", sm: "0.7rem" }, py: { xs: 0.15, sm: 0.25 } }}
                          >
                            +WO
                          </Button>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Activity Form Dialog */}
      {openForm && (
        <ActivityForm
          open={openForm}
          onClose={handleCloseForm}
          selectedDay={selectedDay}
          activityType={formType}
          editingActivity={editingActivity}
        />
      )}
    </Box>
  );
}
