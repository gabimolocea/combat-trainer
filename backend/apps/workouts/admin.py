from django.contrib import admin
from .models import Workout, WorkoutBlock, WorkoutExercise


class WorkoutBlockInline(admin.TabularInline):
    model = WorkoutBlock
    extra = 0


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 0
    raw_id_fields = ["exercise"]


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ["title", "difficulty_level", "visibility", "created_by", "created_at"]
    list_filter = ["difficulty_level", "visibility", "is_template"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ["created_by"]
    inlines = [WorkoutBlockInline]


@admin.register(WorkoutBlock)
class WorkoutBlockAdmin(admin.ModelAdmin):
    list_display = ["workout", "block_type", "title", "sort_order"]
    list_filter = ["block_type"]
    inlines = [WorkoutExerciseInline]
