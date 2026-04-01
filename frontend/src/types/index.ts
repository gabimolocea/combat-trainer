// Auth
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Taxonomy
export interface MartialStyle {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

export interface WorkoutType {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface BodyPart {
  id: number;
  name: string;
  slug: string;
}

export interface Equipment {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

// Exercises
export interface ExerciseMedia {
  id: number;
  media_type: "video" | "gif" | "image";
  file_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}

export interface Exercise {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  instructions: string;
  common_mistakes: string;
  safety_notes: string;
  difficulty_level: "beginner" | "intermediate" | "advanced" | "expert";
  duration_hint_seconds: number | null;
  is_public: boolean;
  created_by: { id: number; username: string };
  primary_style: number | null;
  primary_style_name: string | null;
  workout_types: number[];
  body_parts: number[];
  body_part_slugs?: string[];
  equipment_required: number[];
  tags: number[];
  media: ExerciseMedia[];
  created_at: string;
  updated_at: string;
}

// Workouts
export interface WorkoutExercise {
  id: number;
  exercise: number;
  exercise_title: string;
  sort_order: number;
  reps: number | null;
  sets: number | null;
  rounds: number | null;
  work_seconds: number | null;
  rest_seconds: number | null;
  distance_meters: number | null;
  notes: string;
}

export interface WorkoutBlock {
  id: number;
  block_type: "warmup" | "technique" | "rounds" | "conditioning" | "cooldown";
  title: string;
  notes: string;
  sort_order: number;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: number;
  title: string;
  slug: string;
  description: string;
  visibility: "private" | "followers" | "public";
  difficulty_level: "beginner" | "intermediate" | "advanced" | "expert";
  estimated_duration_minutes: number | null;
  primary_style: number | null;
  primary_style_name: string | null;
  workout_types: number[];
  body_parts: number[];
  equipment_used: number[];
  tags: number[];
  is_template: boolean;
  is_bookmarked: boolean;
  blocks: WorkoutBlock[];
  created_by: { id: number; username: string };
  created_at: string;
  updated_at: string;
}

// Plans
export interface TrainingPlanDay {
  id: number;
  day_number: number;
  title: string;
  workout: number | null;
  workout_title: string | null;
  notes: string;
}

export interface TrainingPlanWeek {
  id: number;
  week_number: number;
  title: string;
  notes: string;
  days: TrainingPlanDay[];
}

export interface TrainingPlan {
  id: number;
  title: string;
  description: string;
  visibility: "private" | "followers" | "public";
  difficulty_level: string;
  duration_weeks: number;
  primary_style: number | null;
  tags: number[];
  weeks: TrainingPlanWeek[];
  created_by: { id: number; username: string };
  created_at: string;
  updated_at: string;
}

// Calendar
export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  event_type: "workout" | "plan_day" | "custom_training" | "partner_session" | "rest_day";
  workout: number | null;
  training_plan_day: number | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  status: "planned" | "completed" | "skipped" | "canceled" | "rescheduled";
  visibility: string;
  location_text: string;
  invited_users: number[];
  owner: { id: number; username: string };
  created_by: { id: number; username: string };
  created_at: string;
  updated_at: string;
}

// Tracking
export interface WorkoutSession {
  id: number;
  workout: number | null;
  workout_title: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  perceived_intensity: number | null;
  notes: string;
  rating: number | null;
  status: "in_progress" | "completed" | "abandoned";
}

export interface TrackingStats {
  total_sessions: number;
  total_time_seconds: number;
  weekly_sessions: number;
  weekly_time_seconds: number;
  current_streak_days: number;
}

// Profile
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  location_text: string;
  experience_level: string;
  preferred_styles: number[];
  available_equipment: number[];
  body_focus_preferences: number[];
  weekly_availability: number;
  visibility: string;
  created_at: string;
  updated_at: string;
}

// Social
export interface PartnerRelation {
  id: number;
  requester: { id: number; username: string };
  addressee: { id: number; username: string };
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface FollowRelation {
  id: number;
  follower: { id: number; username: string };
  followed_user: { id: number; username: string };
  created_at: string;
}

// Notification
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  payload_json: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Scheduled Activities (Calendar)
export interface TrainingType {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface ScheduledQuickTraining {
  id: number;
  user: number;
  training_type: number;
  training_type_name?: string;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduledWorkout {
  id: number;
  user: number;
  workout: number;
  workout_title?: string;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  total_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarDayData {
  date: string;
  quick_trainings: ScheduledQuickTraining[];
  workouts: ScheduledWorkout[];
}
