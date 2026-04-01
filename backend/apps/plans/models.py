from django.conf import settings
from django.db import models


class TrainingPlan(models.Model):
    class Visibility(models.TextChoices):
        PRIVATE = "private", "Private"
        FOLLOWERS = "followers", "Followers"
        PUBLIC = "public", "Public"

    class DifficultyLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"
        EXPERT = "expert", "Expert"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="training_plans",
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE
    )
    primary_style = models.ForeignKey(
        "taxonomy.MartialStyle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_plans",
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER,
    )
    duration_weeks = models.PositiveIntegerField(default=4)
    tags = models.ManyToManyField(
        "taxonomy.Tag", blank=True, related_name="training_plans"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class TrainingPlanWeek(models.Model):
    training_plan = models.ForeignKey(
        TrainingPlan, on_delete=models.CASCADE, related_name="weeks"
    )
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["week_number"]
        unique_together = ["training_plan", "week_number"]

    def __str__(self):
        return f"{self.training_plan.title} - Week {self.week_number}"


class TrainingPlanDay(models.Model):
    training_plan_week = models.ForeignKey(
        TrainingPlanWeek, on_delete=models.CASCADE, related_name="days"
    )
    day_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200, blank=True)
    workout = models.ForeignKey(
        "workouts.Workout",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plan_days",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["day_number"]
        unique_together = ["training_plan_week", "day_number"]

    def __str__(self):
        return f"Week {self.training_plan_week.week_number}, Day {self.day_number}"
