from django.contrib import admin
from .models import Exercise


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["title", "difficulty_level", "primary_style", "is_public", "created_by", "created_at"]
    list_filter = ["difficulty_level", "is_public", "primary_style"]
    search_fields = ["title", "short_description"]
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ["created_by"]
    filter_horizontal = ["workout_types", "body_parts", "equipment_required", "tags"]
