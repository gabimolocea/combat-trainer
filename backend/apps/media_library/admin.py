from django.contrib import admin
from .models import ExerciseMedia


@admin.register(ExerciseMedia)
class ExerciseMediaAdmin(admin.ModelAdmin):
    list_display = ["exercise", "media_type", "sort_order", "created_at"]
    list_filter = ["media_type"]
    raw_id_fields = ["exercise"]
