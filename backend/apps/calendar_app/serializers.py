from rest_framework import serializers
from .models import (
    CalendarEvent, EventInviteResponse,
    ScheduledQuickTraining, ScheduledWorkout
)
from apps.users.serializers import UserMinimalSerializer
from apps.taxonomy.serializers import TrainingTypeSerializer
from apps.workouts.serializers import WorkoutListSerializer


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


# ─── Scheduled Activities (Calendar Week View) ───


class ScheduledQuickTrainingSerializer(serializers.ModelSerializer):
    training_type_name = serializers.CharField(source="training_type.name", read_only=True)
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = ScheduledQuickTraining
        fields = [
            "id", "training_type", "training_type_name", "scheduled_date",
            "start_time", "end_time", "duration_minutes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_end_time(self, obj):
        return obj.get_end_time().isoformat()

    def validate(self, data):
        obj = ScheduledQuickTraining(**data)
        obj.user = self.context["request"].user
        obj.full_clean()
        return data

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.training_type = validated_data.get("training_type", instance.training_type)
        instance.scheduled_date = validated_data.get("scheduled_date", instance.scheduled_date)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.duration_minutes = validated_data.get("duration_minutes", instance.duration_minutes)
        instance.full_clean()
        instance.save()
        return instance


class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source="workout.title", read_only=True)
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = ScheduledWorkout
        fields = [
            "id", "workout", "workout_title", "scheduled_date",
            "start_time", "end_time", "total_duration_minutes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_end_time(self, obj):
        return obj.get_end_time().isoformat()

    def validate(self, data):
        obj = ScheduledWorkout(**data)
        obj.user = self.context["request"].user
        obj.full_clean()
        return data

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.workout = validated_data.get("workout", instance.workout)
        instance.scheduled_date = validated_data.get("scheduled_date", instance.scheduled_date)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.total_duration_minutes = validated_data.get("total_duration_minutes", instance.total_duration_minutes)
        instance.full_clean()
        instance.save()
        return instance


class CalendarDaySerializer(serializers.Serializer):
    """Serializer for a single day in calendar with all activities"""
    date = serializers.DateField()
    quick_trainings = ScheduledQuickTrainingSerializer(many=True, read_only=True)
    workouts = ScheduledWorkoutSerializer(many=True, read_only=True)
