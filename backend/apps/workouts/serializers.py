from rest_framework import serializers
from .models import Workout, WorkoutBlock, WorkoutExercise
from apps.users.serializers import UserMinimalSerializer


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_title = serializers.CharField(source="exercise.title", read_only=True)
    exercise_slug = serializers.CharField(source="exercise.slug", read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = [
            "id", "exercise", "exercise_title", "exercise_slug", "sort_order",
            "reps", "sets", "rounds", "work_seconds", "rest_seconds",
            "distance_meters", "notes",
        ]


class WorkoutBlockSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)

    class Meta:
        model = WorkoutBlock
        fields = ["id", "block_type", "title", "notes", "sort_order", "exercises"]


class WorkoutListSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    primary_style_name = serializers.CharField(
        source="primary_style.name", read_only=True, default=None
    )
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = [
            "id", "title", "slug", "description", "visibility",
            "difficulty_level", "estimated_duration_minutes",
            "primary_style", "primary_style_name", "is_template",
            "is_bookmarked", "created_by", "created_at", "updated_at",
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarked_by.filter(id=request.user.id).exists()
        return False


class WorkoutDetailSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    blocks = WorkoutBlockSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = [
            "id", "title", "slug", "description", "visibility",
            "difficulty_level", "estimated_duration_minutes",
            "primary_style", "workout_types", "body_parts",
            "equipment_used", "tags", "is_template", "is_bookmarked",
            "blocks", "created_by", "created_at", "updated_at",
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarked_by.filter(id=request.user.id).exists()
        return False


class WorkoutCreateSerializer(serializers.ModelSerializer):
    blocks = WorkoutBlockSerializer(many=True, required=False)
    id = serializers.IntegerField(read_only=True)
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Workout
        fields = [
            "id", "slug", "title", "description", "visibility", "difficulty_level",
            "estimated_duration_minutes", "primary_style",
            "workout_types", "body_parts", "equipment_used", "tags",
            "is_template", "blocks",
        ]

    def create(self, validated_data):
        blocks_data = validated_data.pop("blocks", [])
        m2m = {}
        for f in ["workout_types", "body_parts", "equipment_used", "tags"]:
            if f in validated_data:
                m2m[f] = validated_data.pop(f)

        from django.utils.text import slugify
        import uuid
        validated_data["slug"] = slugify(validated_data["title"]) + "-" + uuid.uuid4().hex[:6]
        validated_data["created_by"] = self.context["request"].user
        workout = Workout.objects.create(**validated_data)

        for f, vals in m2m.items():
            getattr(workout, f).set(vals)

        for block_data in blocks_data:
            exercises_data = block_data.pop("exercises", [])
            block = WorkoutBlock.objects.create(workout=workout, **block_data)
            for ex_data in exercises_data:
                WorkoutExercise.objects.create(workout_block=block, **ex_data)

        return workout

    def update(self, instance, validated_data):
        blocks_data = validated_data.pop("blocks", None)
        m2m = {}
        for f in ["workout_types", "body_parts", "equipment_used", "tags"]:
            if f in validated_data:
                m2m[f] = validated_data.pop(f)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        for f, vals in m2m.items():
            getattr(instance, f).set(vals)

        if blocks_data is not None:
            instance.blocks.all().delete()
            for block_data in blocks_data:
                exercises_data = block_data.pop("exercises", [])
                block = WorkoutBlock.objects.create(workout=instance, **block_data)
                for ex_data in exercises_data:
                    WorkoutExercise.objects.create(workout_block=block, **ex_data)

        return instance
