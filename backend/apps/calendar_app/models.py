from django.conf import settings
from django.db import models


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
