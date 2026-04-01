from rest_framework import serializers
from .models import TrainingPlan, TrainingPlanWeek, TrainingPlanDay
from apps.users.serializers import UserMinimalSerializer


class TrainingPlanDaySerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source="workout.title", read_only=True, default=None)

    class Meta:
        model = TrainingPlanDay
        fields = ["id", "day_number", "title", "workout", "workout_title", "notes"]


class TrainingPlanWeekSerializer(serializers.ModelSerializer):
    days = TrainingPlanDaySerializer(many=True, required=False)

    class Meta:
        model = TrainingPlanWeek
        fields = ["id", "week_number", "title", "notes", "days"]


class TrainingPlanListSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TrainingPlan
        fields = [
            "id", "title", "description", "visibility", "difficulty_level",
            "duration_weeks", "primary_style", "created_by",
            "created_at", "updated_at",
        ]


class TrainingPlanDetailSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    weeks = TrainingPlanWeekSerializer(many=True, read_only=True)

    class Meta:
        model = TrainingPlan
        fields = [
            "id", "title", "description", "visibility", "difficulty_level",
            "duration_weeks", "primary_style", "tags", "weeks",
            "created_by", "created_at", "updated_at",
        ]


class TrainingPlanCreateSerializer(serializers.ModelSerializer):
    weeks = TrainingPlanWeekSerializer(many=True, required=False)

    class Meta:
        model = TrainingPlan
        fields = [
            "title", "description", "visibility", "difficulty_level",
            "duration_weeks", "primary_style", "tags", "weeks",
        ]

    def create(self, validated_data):
        weeks_data = validated_data.pop("weeks", [])
        tags = validated_data.pop("tags", [])
        validated_data["created_by"] = self.context["request"].user
        plan = TrainingPlan.objects.create(**validated_data)
        if tags:
            plan.tags.set(tags)

        for week_data in weeks_data:
            days_data = week_data.pop("days", [])
            week = TrainingPlanWeek.objects.create(training_plan=plan, **week_data)
            for day_data in days_data:
                TrainingPlanDay.objects.create(training_plan_week=week, **day_data)

        return plan

    def update(self, instance, validated_data):
        weeks_data = validated_data.pop("weeks", None)
        tags = validated_data.pop("tags", None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if tags is not None:
            instance.tags.set(tags)

        if weeks_data is not None:
            instance.weeks.all().delete()
            for week_data in weeks_data:
                days_data = week_data.pop("days", [])
                week = TrainingPlanWeek.objects.create(training_plan=instance, **week_data)
                for day_data in days_data:
                    TrainingPlanDay.objects.create(training_plan_week=week, **day_data)

        return instance
