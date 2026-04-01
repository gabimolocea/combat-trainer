from rest_framework import serializers
from .models import ExerciseMedia


class ExerciseMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source="file", read_only=True)
    thumbnail_url = serializers.ImageField(source="thumbnail", read_only=True)

    class Meta:
        model = ExerciseMedia
        fields = [
            "id", "media_type", "file_url", "thumbnail_url",
            "duration_seconds", "width", "height", "sort_order", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ExerciseMediaUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseMedia
        fields = ["media_type", "file", "thumbnail", "duration_seconds", "width", "height", "sort_order"]

    def validate_file(self, value):
        from django.conf import settings
        if value.size > settings.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("File size exceeds 100MB limit.")
        return value
