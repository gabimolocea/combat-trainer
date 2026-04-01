from django.conf import settings
from django.db import models


class Report(models.Model):
    class ReportType(models.TextChoices):
        EXERCISE = "exercise", "Exercise"
        WORKOUT = "workout", "Workout"
        PLAN = "plan", "Plan"
        USER = "user", "User"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        REVIEWED = "reviewed", "Reviewed"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_submitted",
    )
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    target_id = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_reviewed",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.report_type}:{self.target_id} by {self.reporter}"
