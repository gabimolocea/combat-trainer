from django.contrib import admin
from .models import TrainingPlan, TrainingPlanWeek, TrainingPlanDay


class TrainingPlanWeekInline(admin.TabularInline):
    model = TrainingPlanWeek
    extra = 0


class TrainingPlanDayInline(admin.TabularInline):
    model = TrainingPlanDay
    extra = 0
    raw_id_fields = ["workout"]


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    list_display = ["title", "difficulty_level", "visibility", "duration_weeks", "created_by", "created_at"]
    list_filter = ["difficulty_level", "visibility"]
    search_fields = ["title", "description"]
    raw_id_fields = ["created_by"]
    inlines = [TrainingPlanWeekInline]


@admin.register(TrainingPlanWeek)
class TrainingPlanWeekAdmin(admin.ModelAdmin):
    list_display = ["training_plan", "week_number", "title"]
    inlines = [TrainingPlanDayInline]
