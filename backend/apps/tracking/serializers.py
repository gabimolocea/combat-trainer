from rest_framework import serializers
from .models import WorkoutSession, SessionExerciseLog


class SessionExerciseLogSerializer(serializers.ModelSerializer):
    exercise_title = serializers.CharField(source="exercise.title", read_only=True, default=None)

    class Meta:
        model = SessionExerciseLog
        fields = [
            "id", "exercise", "exercise_title", "completed_sets",
            "completed_reps", "completed_rounds", "work_seconds",
            "rest_seconds", "notes",
        ]


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source="workout.title", read_only=True, default=None)

    class Meta:
        model = WorkoutSession
        fields = [
            "id", "workout", "workout_title", "started_at", "completed_at",
            "duration_seconds", "perceived_intensity", "rating", "status",
        ]


class WorkoutSessionDetailSerializer(serializers.ModelSerializer):
    exercise_logs = SessionExerciseLogSerializer(many=True, read_only=True)
    workout_title = serializers.CharField(source="workout.title", read_only=True, default=None)

    class Meta:
        model = WorkoutSession
        fields = [
            "id", "workout", "workout_title", "started_at", "completed_at",
            "duration_seconds", "perceived_intensity", "notes", "rating",
            "status", "exercise_logs",
        ]


class WorkoutSessionCreateSerializer(serializers.ModelSerializer):
    exercise_logs = SessionExerciseLogSerializer(many=True, required=False)

    class Meta:
        model = WorkoutSession
        fields = [
            "workout", "perceived_intensity", "notes", "rating",
            "exercise_logs",
        ]

    def create(self, validated_data):
        logs_data = validated_data.pop("exercise_logs", [])
        validated_data["user"] = self.context["request"].user
        session = WorkoutSession.objects.create(**validated_data)
        for log_data in logs_data:
            SessionExerciseLog.objects.create(workout_session=session, **log_data)
        return session
