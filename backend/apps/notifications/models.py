from django.conf import settings
from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        PARTNER_INVITE = "partner_invite", "Partner Invite"
        PARTNER_ACCEPTED = "partner_accepted", "Partner Accepted"
        EVENT_INVITE = "event_invite", "Event Invite"
        EVENT_REMINDER = "event_reminder", "Event Reminder"
        WORKOUT_SHARED = "workout_shared", "Workout Shared"
        NEW_FOLLOWER = "new_follower", "New Follower"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    payload_json = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type}: {self.title}"
