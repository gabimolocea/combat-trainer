from django.conf import settings
from django.db import models


class Workout(models.Model):
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
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workouts",
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER,
    )
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    primary_style = models.ForeignKey(
        "taxonomy.MartialStyle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workouts",
    )
    workout_types = models.ManyToManyField(
        "taxonomy.WorkoutType", blank=True, related_name="workouts"
    )
    body_parts = models.ManyToManyField(
        "taxonomy.BodyPart", blank=True, related_name="workouts"
    )
    equipment_used = models.ManyToManyField(
        "taxonomy.Equipment", blank=True, related_name="workouts"
    )
    tags = models.ManyToManyField(
        "taxonomy.Tag", blank=True, related_name="workouts"
    )
    is_template = models.BooleanField(default=False)
    bookmarked_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="bookmarked_workouts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class WorkoutBlock(models.Model):
    class BlockType(models.TextChoices):
        WARMUP = "warmup", "Warmup"
        TECHNIQUE = "technique", "Technique"
        ROUNDS = "rounds", "Rounds"
        CONDITIONING = "conditioning", "Conditioning"
        COOLDOWN = "cooldown", "Cooldown"

    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="blocks"
    )
    block_type = models.CharField(max_length=20, choices=BlockType.choices)
    title = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.workout.title} - {self.title or self.block_type}"


class WorkoutExercise(models.Model):
    workout_block = models.ForeignKey(
        WorkoutBlock, on_delete=models.CASCADE, related_name="exercises"
    )
    exercise = models.ForeignKey(
        "exercises.Exercise", on_delete=models.CASCADE, related_name="workout_exercises"
    )
    sort_order = models.PositiveIntegerField(default=0)
    reps = models.PositiveIntegerField(null=True, blank=True)
    sets = models.PositiveIntegerField(null=True, blank=True)
    rounds = models.PositiveIntegerField(null=True, blank=True)
    work_seconds = models.PositiveIntegerField(null=True, blank=True)
    rest_seconds = models.PositiveIntegerField(null=True, blank=True)
    distance_meters = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.exercise.title} in {self.workout_block}"
