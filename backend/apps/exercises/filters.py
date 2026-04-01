import django_filters
from django.db import models
from .models import Exercise


class ExerciseFilter(django_filters.FilterSet):
    style = django_filters.CharFilter(field_name="primary_style__slug")
    workout_type = django_filters.CharFilter(field_name="workout_types__slug")
    body_part = django_filters.CharFilter(field_name="body_parts__slug")
    equipment = django_filters.CharFilter(field_name="equipment_required__slug")
    difficulty = django_filters.CharFilter(field_name="difficulty_level")
    duration_max = django_filters.NumberFilter(
        field_name="duration_hint_seconds", lookup_expr="lte"
    )
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Exercise
        fields = ["style", "workout_type", "body_part", "equipment", "difficulty"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(title__icontains=value)
            | models.Q(short_description__icontains=value)
        )
