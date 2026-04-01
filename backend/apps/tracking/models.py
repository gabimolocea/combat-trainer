from django.conf import settings
from django.db import models


class WorkoutSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workout_sessions",
    )
    workout = models.ForeignKey(
        "workouts.Workout",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    perceived_intensity = models.PositiveIntegerField(
        null=True, blank=True, help_text="1-10 RPE scale"
    )
    notes = models.TextField(blank=True)
    rating = models.PositiveIntegerField(
        null=True, blank=True, help_text="1-5 star rating"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Session by {self.user} ({self.started_at})"


class SessionExerciseLog(models.Model):
    workout_session = models.ForeignKey(
        WorkoutSession, on_delete=models.CASCADE, related_name="exercise_logs"
    )
    exercise = models.ForeignKey(
        "exercises.Exercise",
        on_delete=models.SET_NULL,
        null=True,
        related_name="session_logs",
    )
    completed_sets = models.PositiveIntegerField(null=True, blank=True)
    completed_reps = models.PositiveIntegerField(null=True, blank=True)
    completed_rounds = models.PositiveIntegerField(null=True, blank=True)
    work_seconds = models.PositiveIntegerField(null=True, blank=True)
    rest_seconds = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Log: {self.exercise} in session {self.workout_session_id}"
