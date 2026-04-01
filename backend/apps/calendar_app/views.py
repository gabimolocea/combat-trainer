from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from common.permissions import IsOwner
from .models import (
    CalendarEvent, EventInviteResponse,
    ScheduledQuickTraining, ScheduledWorkout
)
from .serializers import (
    CalendarEventListSerializer,
    CalendarEventDetailSerializer,
    CalendarEventCreateSerializer,
    InviteSerializer,
    RespondSerializer,
    ScheduledQuickTrainingSerializer,
    ScheduledWorkoutSerializer,
    CalendarDaySerializer,
)

User = get_user_model()


class CalendarEventViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ["starts_at", "created_at"]

    def get_queryset(self):
        qs = CalendarEvent.objects.select_related("owner", "created_by", "workout").prefetch_related(
            "invited_users", "invite_responses__user"
        )
        return qs.filter(
            Q(owner=self.request.user) | Q(invited_users=self.request.user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return CalendarEventListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CalendarEventCreateSerializer
        return CalendarEventDetailSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS and obj.owner != request.user:
            self.permission_denied(request)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        event = self.get_object()
        if event.owner != request.user:
            return Response({"error": "Only the owner can invite."}, status=status.HTTP_403_FORBIDDEN)

        ser = InviteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        users = User.objects.filter(id__in=ser.validated_data["user_ids"])
        for user in users:
            event.invited_users.add(user)
            EventInviteResponse.objects.get_or_create(event=event, user=user)
        return Response({"status": "invited"})

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        event = self.get_object()
        ser = RespondSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        invite_resp, created = EventInviteResponse.objects.get_or_create(
            event=event, user=request.user
        )
        invite_resp.status = ser.validated_data["status"]
        invite_resp.responded_at = timezone.now()
        invite_resp.save()
        return Response({"status": invite_resp.status})


# ─── Scheduled Activities ViewSets ───


class ScheduledQuickTrainingViewSet(viewsets.ModelViewSet):
    """API for scheduled quick trainings"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScheduledQuickTrainingSerializer
    ordering_fields = ["scheduled_date", "start_time"]

    def get_queryset(self):
        return ScheduledQuickTraining.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def check_object_permissions(self, request, obj):
        if obj.user != request.user:
            self.permission_denied(request)


class ScheduledWorkoutViewSet(viewsets.ModelViewSet):
    """API for scheduled workouts"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScheduledWorkoutSerializer
    ordering_fields = ["scheduled_date", "start_time"]

    def get_queryset(self):
        return ScheduledWorkout.objects.filter(user=self.request.user).select_related("workout")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def check_object_permissions(self, request, obj):
        if obj.user != request.user:
            self.permission_denied(request)


class CalendarWeekView(generics.ListAPIView):
    """Get all scheduled activities for a week (infinite scroll)"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CalendarDaySerializer

    def get(self, request, *args, **kwargs):
        # Get start_date from query params (e.g., 2026-04-01)
        start_date_str = request.query_params.get("start_date")
        num_days = int(request.query_params.get("num_days", 30))  # Default 30 days for scroll

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid start_date format (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        end_date = start_date + timedelta(days=num_days)
        days_data = []

        for i in range(num_days):
            current_date = start_date + timedelta(days=i)
            quick_trainings = ScheduledQuickTraining.objects.filter(
                user=request.user,
                scheduled_date=current_date
            ).order_by("start_time")
            workouts = ScheduledWorkout.objects.filter(
                user=request.user,
                scheduled_date=current_date
            ).order_by("start_time").select_related("workout")

            day_data = {
                "date": current_date,
                "quick_trainings": quick_trainings,
                "workouts": workouts,
            }
            days_data.append(day_data)

        ser = CalendarDaySerializer(days_data, many=True)
        return Response(ser.data)

