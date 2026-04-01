from django.db import models


class ExerciseMedia(models.Model):
    class MediaType(models.TextChoices):
        VIDEO = "video", "Video"
        GIF = "gif", "GIF"
        IMAGE = "image", "Image"

    exercise = models.ForeignKey(
        "exercises.Exercise",
        on_delete=models.CASCADE,
        related_name="media",
    )
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    file = models.FileField(upload_to="exercises/media/%Y/%m/")
    thumbnail = models.ImageField(
        upload_to="exercises/thumbnails/%Y/%m/", blank=True, null=True
    )
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"{self.exercise.title} - {self.media_type}"
