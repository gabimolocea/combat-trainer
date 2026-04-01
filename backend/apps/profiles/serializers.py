from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id", "username", "email", "display_name", "bio", "avatar_url",
            "location_text", "experience_level", "preferred_styles",
            "available_equipment", "body_focus_preferences",
            "weekly_availability", "visibility", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserProfilePublicSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id", "username", "display_name", "bio", "avatar_url",
            "location_text", "experience_level", "preferred_styles",
        ]
        read_only_fields = fields
