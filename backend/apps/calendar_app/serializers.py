from rest_framework import serializers
from .models import CalendarEvent, EventInviteResponse
from apps.users.serializers import UserMinimalSerializer


class EventInviteResponseSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = EventInviteResponse
        fields = ["id", "user", "status", "responded_at"]


class CalendarEventListSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            "id", "title", "event_type", "workout", "starts_at",
            "ends_at", "status", "visibility", "owner", "created_at",
        ]


class CalendarEventDetailSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    invite_responses = EventInviteResponseSerializer(many=True, read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            "id", "title", "description", "event_type", "workout",
            "training_plan_day", "starts_at", "ends_at", "timezone",
            "status", "visibility", "location_text", "invited_users",
            "invite_responses", "owner", "created_by", "created_at", "updated_at",
        ]


class CalendarEventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            "title", "description", "event_type", "workout",
            "training_plan_day", "starts_at", "ends_at", "timezone",
            "status", "visibility", "location_text", "invited_users",
        ]

    def create(self, validated_data):
        invited = validated_data.pop("invited_users", [])
        validated_data["owner"] = self.context["request"].user
        validated_data["created_by"] = self.context["request"].user
        event = CalendarEvent.objects.create(**validated_data)
        if invited:
            event.invited_users.set(invited)
            for user in invited:
                EventInviteResponse.objects.create(event=event, user=user)
        return event


class InviteSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.IntegerField())


class RespondSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["accepted", "declined"])
