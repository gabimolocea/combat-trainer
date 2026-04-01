from django.contrib import admin
from .models import WorkoutSession, SessionExerciseLog


class SessionExerciseLogInline(admin.TabularInline):
    model = SessionExerciseLog
    extra = 0
    raw_id_fields = ["exercise"]


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "workout", "status", "started_at", "completed_at"]
    list_filter = ["status"]
    raw_id_fields = ["user", "workout"]
    inlines = [SessionExerciseLogInline]
