from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from common.permissions import IsOwner
from .models import CalendarEvent, EventInviteResponse
from .serializers import (
    CalendarEventListSerializer,
    CalendarEventDetailSerializer,
    CalendarEventCreateSerializer,
    InviteSerializer,
    RespondSerializer,
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
