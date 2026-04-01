from rest_framework import serializers
from .models import Exercise
from apps.media_library.serializers import ExerciseMediaSerializer
from apps.users.serializers import UserMinimalSerializer


class ExerciseListSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    primary_style_name = serializers.CharField(
        source="primary_style.name", read_only=True, default=None
    )
    media = ExerciseMediaSerializer(many=True, read_only=True)
    body_part_slugs = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = [
            "id", "title", "slug", "short_description", "difficulty_level",
            "duration_hint_seconds", "is_public", "created_by",
            "primary_style", "primary_style_name", "body_part_slugs", "media",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_by", "created_at", "updated_at"]

    def get_body_part_slugs(self, obj):
        return list(obj.body_parts.values_list("slug", flat=True))


class ExerciseDetailSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    media = ExerciseMediaSerializer(many=True, read_only=True)
    body_part_slugs = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = [
            "id", "title", "slug", "short_description", "full_description",
            "instructions", "common_mistakes", "safety_notes",
            "difficulty_level", "duration_hint_seconds", "is_public",
            "created_by", "primary_style", "workout_types", "body_parts",
            "body_part_slugs",
            "equipment_required", "tags", "media", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_by", "created_at", "updated_at"]

    def get_body_part_slugs(self, obj):
        return list(obj.body_parts.values_list("slug", flat=True))


class ExerciseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            "id", "slug", "title", "short_description", "full_description",
            "instructions", "common_mistakes", "safety_notes",
            "difficulty_level", "duration_hint_seconds", "is_public",
            "primary_style", "workout_types", "body_parts",
            "equipment_required", "tags",
        ]
        read_only_fields = ["id", "slug"]

    def create(self, validated_data):
        m2m_fields = {}
        for field in ["workout_types", "body_parts", "equipment_required", "tags"]:
            if field in validated_data:
                m2m_fields[field] = validated_data.pop(field)

        from django.utils.text import slugify
        validated_data["slug"] = slugify(validated_data["title"])
        validated_data["created_by"] = self.context["request"].user
        exercise = Exercise.objects.create(**validated_data)

        for field, values in m2m_fields.items():
            getattr(exercise, field).set(values)

        return exercise
