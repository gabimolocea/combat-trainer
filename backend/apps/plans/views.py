from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from common.permissions import IsOwnerOrReadOnly
from .models import TrainingPlan
from .serializers import (
    TrainingPlanListSerializer,
    TrainingPlanDetailSerializer,
    TrainingPlanCreateSerializer,
)


class TrainingPlanViewSet(viewsets.ModelViewSet):
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "difficulty_level"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        qs = TrainingPlan.objects.select_related("created_by", "primary_style").prefetch_related(
            "weeks__days__workout", "tags"
        )
        if self.request.user.is_authenticated:
            return qs.filter(Q(visibility="public") | Q(created_by=self.request.user))
        return qs.filter(visibility="public")

    def get_serializer_class(self):
        if self.action == "list":
            return TrainingPlanListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return TrainingPlanCreateSerializer
        return TrainingPlanDetailSerializer

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        plan = self.get_object()
        new_plan = TrainingPlan.objects.create(
            title=f"{plan.title} (Copy)",
            description=plan.description,
            created_by=request.user,
            visibility="private",
            difficulty_level=plan.difficulty_level,
            duration_weeks=plan.duration_weeks,
            primary_style=plan.primary_style,
        )
        new_plan.tags.set(plan.tags.all())

        from .models import TrainingPlanWeek, TrainingPlanDay
        for week in plan.weeks.all():
            new_week = TrainingPlanWeek.objects.create(
                training_plan=new_plan,
                week_number=week.week_number,
                title=week.title,
                notes=week.notes,
            )
            for day in week.days.all():
                TrainingPlanDay.objects.create(
                    training_plan_week=new_week,
                    day_number=day.day_number,
                    title=day.title,
                    workout=day.workout,
                    notes=day.notes,
                )

        return Response(
            TrainingPlanDetailSerializer(new_plan, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )
