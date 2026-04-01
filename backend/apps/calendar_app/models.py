from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from datetime import timedelta


class ScheduledQuickTraining(models.Model):
    """Quick training entry on calendar (Run, Cycling, etc.)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scheduled_quick_trainings",
    )
    training_type = models.ForeignKey(
        "taxonomy.TrainingType",
        on_delete=models.CASCADE,
        related_name="scheduled_trainings",
    )
    scheduled_date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField()  # Total duration
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_date", "start_time"]
        unique_together = [("user", "scheduled_date", "start_time")]  # Prevent exact duplicates

    def __str__(self):
        return f"{self.user} - {self.training_type} on {self.scheduled_date}"

    def get_end_time(self):
        """Calculate end time based on duration"""
        from datetime import time, datetime
        start_dt = datetime.combine(self.scheduled_date, self.start_time)
        end_dt = start_dt + timedelta(minutes=self.duration_minutes)
        return end_dt.time()

    def clean(self):
        """Validate no time conflicts with other activities"""
        if self.pk:
            exclude = {"pk": self.pk}
        else:
            exclude = {}

        # Check against other quick trainings
        end_time_obj = self.get_end_time()
        conflicts = ScheduledQuickTraining.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
            **exclude
        ).exclude(pk=self.pk) if self.pk else ScheduledQuickTraining.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        )

        for other in conflicts:
            other_end = other.get_end_time()
            if not (end_time_obj <= other.start_time or self.start_time >= other_end):
                raise ValidationError(
                    f"Time conflict with {other.training_type} "
                    f"{other.start_time.strftime('%H:%M')} - {other_end.strftime('%H:%M')}"
                )

        # Check against scheduled workouts
        conflicts_workout = ScheduledWorkout.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        ).exclude(pk=self.pk) if self.pk else ScheduledWorkout.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        )

        for workout in conflicts_workout:
            workout_end = workout.get_end_time()
            if not (end_time_obj <= workout.start_time or self.start_time >= workout_end):
                raise ValidationError(
                    f"Time conflict with workout "
                    f"{workout.start_time.strftime('%H:%M')} - {workout_end.strftime('%H:%M')}"
                )


class ScheduledWorkout(models.Model):
    """Scheduled workout on calendar"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scheduled_workouts",
    )
    workout = models.ForeignKey(
        "workouts.Workout",
        on_delete=models.CASCADE,
        related_name="scheduled_instances",
    )
    scheduled_date = models.DateField()
    start_time = models.TimeField()
    total_duration_minutes = models.PositiveIntegerField()  # Auto-calculated or custom
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_date", "start_time"]

    def __str__(self):
        return f"{self.user} - {self.workout.title} on {self.scheduled_date}"

    def get_end_time(self):
        """Calculate end time based on duration"""
        from datetime import time, datetime
        start_dt = datetime.combine(self.scheduled_date, self.start_time)
        end_dt = start_dt + timedelta(minutes=self.total_duration_minutes)
        return end_dt.time()

    def clean(self):
        """Validate no time conflicts"""
        if self.pk:
            exclude = {"pk": self.pk}
        else:
            exclude = {}

        # Check against other workouts
        end_time_obj = self.get_end_time()
        conflicts = ScheduledWorkout.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        ).exclude(pk=self.pk) if self.pk else ScheduledWorkout.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        )

        for other in conflicts:
            other_end = other.get_end_time()
            if not (end_time_obj <= other.start_time or self.start_time >= other_end):
                raise ValidationError(
                    f"Time conflict with {other.workout.title} "
                    f"{other.start_time.strftime('%H:%M')} - {other_end.strftime('%H:%M')}"
                )

        # Check against quick trainings
        conflicts_training = ScheduledQuickTraining.objects.filter(
            user=self.user,
            scheduled_date=self.scheduled_date,
        )

        for training in conflicts_training:
            training_end = training.get_end_time()
            if not (end_time_obj <= training.start_time or self.start_time >= training_end):
                raise ValidationError(
                    f"Time conflict with {training.training_type} "
                    f"{training.start_time.strftime('%H:%M')} - {training_end.strftime('%H:%M')}"
                )


class CalendarEvent(models.Model):
    class EventType(models.TextChoices):
        WORKOUT = "workout", "Workout"
        PLAN_DAY = "plan_day", "Plan Day"
        CUSTOM_TRAINING = "custom_training", "Custom Training"
        PARTNER_SESSION = "partner_session", "Partner Session"
        REST_DAY = "rest_day", "Rest Day"

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"
        CANCELED = "canceled", "Canceled"
        RESCHEDULED = "rescheduled", "Rescheduled"

    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        FOLLOWERS = "followers", "Followers"
        INVITED = "invited", "Invited Only"
        PUBLIC = "public", "Public"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_events",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    workout = models.ForeignKey(
        "workouts.Workout",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_events",
    )
    training_plan_day = models.ForeignKey(
        "plans.TrainingPlanDay",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_events",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default="UTC")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNED
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE
    )
    location_text = models.CharField(max_length=300, blank=True)
    invited_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="invited_events",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return f"{self.title} ({self.starts_at})"


class EventInviteResponse(models.Model):
    class ResponseStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"

    event = models.ForeignKey(
        CalendarEvent, on_delete=models.CASCADE, related_name="invite_responses"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_responses"
    )
    status = models.CharField(
        max_length=20, choices=ResponseStatus.choices, default=ResponseStatus.PENDING
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["event", "user"]
