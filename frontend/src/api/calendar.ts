import api from "./client";
import type {
  ScheduledQuickTraining,
  ScheduledWorkout,
  CalendarDayData,
  TrainingType,
  PaginatedResponse,
} from "@/types";

export const calendarAPI = {
  // Quick Trainings
  getQuickTrainings: (params?: {
    start_date?: string;
    end_date?: string;
  }) =>
    api.get<ScheduledQuickTraining[]>("/calendar/scheduled-quick-trainings/", {
      params,
    }),

  createQuickTraining: (data: {
    training_type: number;
    scheduled_date: string;
    start_time: string;
    duration_minutes: number;
  }) => api.post<ScheduledQuickTraining>("/calendar/scheduled-quick-trainings/", data),

  updateQuickTraining: (id: number, data: any) =>
    api.patch<ScheduledQuickTraining>(
      `/calendar/scheduled-quick-trainings/${id}/`,
      data
    ),

  deleteQuickTraining: (id: number) =>
    api.delete(`/calendar/scheduled-quick-trainings/${id}/`),

  // Workouts
  getWorkouts: (params?: {
    start_date?: string;
    end_date?: string;
  }) =>
    api.get<ScheduledWorkout[]>("/calendar/scheduled-workouts/", {
      params,
    }),

  createWorkout: (data: {
    workout: number;
    scheduled_date: string;
    start_time: string;
    total_duration_minutes: number;
  }) => api.post<ScheduledWorkout>("/calendar/scheduled-workouts/", data),

  updateWorkout: (id: number, data: any) =>
    api.patch<ScheduledWorkout>(`/calendar/scheduled-workouts/${id}/`, data),

  deleteWorkout: (id: number) =>
    api.delete(`/calendar/scheduled-workouts/${id}/`),

  // Week view
  getCalendarWeek: (params: { start_date: string; num_days?: number }) =>
    api.get<CalendarDayData[]>("/calendar/week/", { params }),

  // Training Types
  getTrainingTypes: () =>
    api.get<PaginatedResponse<TrainingType>>("/taxonomy/training-types/"),
};
