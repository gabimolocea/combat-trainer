from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from .models import WorkoutSession
from .serializers import (
    WorkoutSessionListSerializer,
    WorkoutSessionDetailSerializer,
    WorkoutSessionCreateSerializer,
)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]
    ordering_fields = ["started_at"]

    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user
        ).select_related("workout").prefetch_related("exercise_logs__exercise")

    def get_serializer_class(self):
        if self.action == "list":
            return WorkoutSessionListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return WorkoutSessionCreateSerializer
        return WorkoutSessionDetailSerializer

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.status = "completed"
        session.completed_at = timezone.now()
        if session.started_at:
            session.duration_seconds = int(
                (session.completed_at - session.started_at).total_seconds()
            )
        session.save()
        return Response(WorkoutSessionDetailSerializer(session).data)


class StatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = WorkoutSession.objects.filter(
            user=request.user, status="completed"
        )
        total = sessions.count()
        total_time = sessions.aggregate(t=Sum("duration_seconds"))["t"] or 0

        # Weekly stats
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        weekly = sessions.filter(completed_at__gte=week_ago)
        weekly_count = weekly.count()
        weekly_time = weekly.aggregate(t=Sum("duration_seconds"))["t"] or 0

        # Streak calculation
        dates = (
            sessions.filter(completed_at__isnull=False)
            .annotate(date=TruncDate("completed_at"))
            .values_list("date", flat=True)
            .distinct()
            .order_by("-date")
        )
        streak = 0
        today = timezone.now().date()
        from datetime import timedelta as td
        for i, d in enumerate(dates):
            expected = today - td(days=i)
            if d == expected:
                streak += 1
            else:
                break

        return Response({
            "total_sessions": total,
            "total_time_seconds": total_time,
            "weekly_sessions": weekly_count,
            "weekly_time_seconds": weekly_time,
            "current_streak_days": streak,
        })
