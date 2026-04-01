from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class ExperienceLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"
        EXPERT = "expert", "Expert"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        FOLLOWERS = "followers", "Followers Only"
        PRIVATE = "private", "Private"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    location_text = models.CharField(max_length=200, blank=True)
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.BEGINNER,
    )
    preferred_styles = models.ManyToManyField(
        "taxonomy.MartialStyle", blank=True, related_name="preferred_by"
    )
    available_equipment = models.ManyToManyField(
        "taxonomy.Equipment", blank=True, related_name="available_to"
    )
    body_focus_preferences = models.ManyToManyField(
        "taxonomy.BodyPart", blank=True, related_name="preferred_by"
    )
    weekly_availability = models.PositiveIntegerField(
        default=3, help_text="Number of training days per week"
    )
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PUBLIC
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"
