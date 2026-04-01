from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from common.permissions import IsOwnerOrReadOnly
from .models import Exercise
from .serializers import ExerciseListSerializer, ExerciseDetailSerializer, ExerciseCreateSerializer
from .filters import ExerciseFilter


class ExerciseViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    filterset_class = ExerciseFilter
    search_fields = ["title", "short_description"]
    ordering_fields = ["title", "created_at", "difficulty_level"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        qs = Exercise.objects.select_related("created_by", "primary_style").prefetch_related(
            "workout_types", "body_parts", "equipment_required", "tags", "media"
        )
        if self.request.user.is_authenticated:
            return qs.filter(Q(is_public=True) | Q(created_by=self.request.user))
        return qs.filter(is_public=True)

    def get_serializer_class(self):
        if self.action == "list":
            return ExerciseListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return ExerciseCreateSerializer
        return ExerciseDetailSerializer
