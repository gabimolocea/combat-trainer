from django.conf import settings
from django.db import models


class Exercise(models.Model):
    class DifficultyLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"
        EXPERT = "expert", "Expert"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    short_description = models.CharField(max_length=300, blank=True)
    full_description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    common_mistakes = models.TextField(blank=True)
    safety_notes = models.TextField(blank=True)
    difficulty_level = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER,
    )
    duration_hint_seconds = models.PositiveIntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercises",
    )
    primary_style = models.ForeignKey(
        "taxonomy.MartialStyle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exercises",
    )
    workout_types = models.ManyToManyField(
        "taxonomy.WorkoutType", blank=True, related_name="exercises"
    )
    body_parts = models.ManyToManyField(
        "taxonomy.BodyPart", blank=True, related_name="exercises"
    )
    equipment_required = models.ManyToManyField(
        "taxonomy.Equipment", blank=True, related_name="exercises"
    )
    tags = models.ManyToManyField(
        "taxonomy.Tag", blank=True, related_name="exercises"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
