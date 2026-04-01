from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from common.permissions import IsOwnerOrReadOnly
from .models import Workout, WorkoutBlock, WorkoutExercise
from .serializers import WorkoutListSerializer, WorkoutDetailSerializer, WorkoutCreateSerializer


class WorkoutViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "difficulty_level"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        qs = Workout.objects.select_related("created_by", "primary_style").prefetch_related(
            "blocks__exercises__exercise", "workout_types", "body_parts", "equipment_used", "tags"
        )
        if self.request.user.is_authenticated:
            qs = qs.filter(
                Q(visibility="public") | Q(created_by=self.request.user)
            )
        else:
            qs = qs.filter(visibility="public")

        # Filter by ownership: mine / community
        owner = self.request.query_params.get("owner")
        if owner == "mine" and self.request.user.is_authenticated:
            qs = qs.filter(created_by=self.request.user)
        elif owner == "community" and self.request.user.is_authenticated:
            qs = qs.exclude(created_by=self.request.user)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return WorkoutListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return WorkoutCreateSerializer
        return WorkoutDetailSerializer

    @action(detail=True, methods=["post"])
    def duplicate(self, request, slug=None):
        workout = self.get_object()
        import uuid
        from django.utils.text import slugify

        new_workout = Workout.objects.create(
            title=f"{workout.title} (Copy)",
            slug=slugify(workout.title) + "-copy-" + uuid.uuid4().hex[:6],
            description=workout.description,
            created_by=request.user,
            visibility="private",
            difficulty_level=workout.difficulty_level,
            estimated_duration_minutes=workout.estimated_duration_minutes,
            primary_style=workout.primary_style,
        )
        new_workout.workout_types.set(workout.workout_types.all())
        new_workout.body_parts.set(workout.body_parts.all())
        new_workout.equipment_used.set(workout.equipment_used.all())
        new_workout.tags.set(workout.tags.all())

        for block in workout.blocks.all():
            from apps.workouts.models import WorkoutBlock, WorkoutExercise
            new_block = WorkoutBlock.objects.create(
                workout=new_workout,
                block_type=block.block_type,
                title=block.title,
                notes=block.notes,
                sort_order=block.sort_order,
            )
            for we in block.exercises.all():
                WorkoutExercise.objects.create(
                    workout_block=new_block,
                    exercise=we.exercise,
                    sort_order=we.sort_order,
                    reps=we.reps,
                    sets=we.sets,
                    rounds=we.rounds,
                    work_seconds=we.work_seconds,
                    rest_seconds=we.rest_seconds,
                    distance_meters=we.distance_meters,
                    notes=we.notes,
                )

        return Response(
            WorkoutDetailSerializer(new_workout, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def bookmark(self, request, pk=None):
        workout = self.get_object()
        workout.bookmarked_by.add(request.user)
        return Response({"status": "bookmarked"})

    @action(detail=True, methods=["delete"], url_path="bookmark")
    def unbookmark(self, request, pk=None):
        workout = self.get_object()
        workout.bookmarked_by.remove(request.user)
        return Response({"status": "unbookmarked"})


class GenerateWorkoutView(APIView):
    """AI-powered workout generator. Builds a workout from criteria using exercise DB."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import uuid
        import random
        from django.utils.text import slugify
        from apps.exercises.models import Exercise
        from apps.taxonomy.models import MartialStyle, BodyPart, Equipment

        gender = request.data.get("gender", "")
        age = request.data.get("age")
        goal = request.data.get("goal", "general_fitness")
        fitness_level = request.data.get("fitness_level", "intermediate")
        equipment_slugs = request.data.get("equipment", [])
        muscle_slugs = request.data.get("muscles", [])
        style_slug = request.data.get("style", "")
        duration = int(request.data.get("duration", 45))

        # Build exercise queryset based on criteria
        exercises_qs = Exercise.objects.filter(is_public=True)
        if fitness_level:
            exercises_qs = exercises_qs.filter(difficulty_level=fitness_level)
        if style_slug:
            exercises_qs = exercises_qs.filter(primary_style__slug=style_slug)
        if muscle_slugs:
            exercises_qs = exercises_qs.filter(body_parts__slug__in=muscle_slugs).distinct()
        if equipment_slugs:
            exercises_qs = exercises_qs.filter(equipment_required__slug__in=equipment_slugs).distinct()

        available = list(exercises_qs[:100])
        if not available:
            # Fallback: get any exercises
            available = list(Exercise.objects.filter(is_public=True)[:30])
        if not available:
            available = list(Exercise.objects.all()[:30])

        if not available:
            return Response(
                {"detail": "No exercises found matching your criteria. Add exercises first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Goal-based workout structure
        STRUCTURES = {
            "general_fitness": [
                ("warmup", "Warm-Up", 3),
                ("technique", "Main Work", 5),
                ("conditioning", "Conditioning", 3),
                ("cooldown", "Cool Down", 2),
            ],
            "strength": [
                ("warmup", "Warm-Up", 2),
                ("technique", "Strength Training", 6),
                ("conditioning", "Finisher", 2),
                ("cooldown", "Cool Down", 2),
            ],
            "endurance": [
                ("warmup", "Warm-Up", 3),
                ("rounds", "Endurance Rounds", 6),
                ("conditioning", "Cardio Burn", 3),
                ("cooldown", "Recovery", 2),
            ],
            "technique": [
                ("warmup", "Warm-Up", 2),
                ("technique", "Technique Drills", 7),
                ("rounds", "Sparring Rounds", 3),
                ("cooldown", "Cool Down", 2),
            ],
            "weight_loss": [
                ("warmup", "Warm-Up", 2),
                ("conditioning", "HIIT Circuit", 5),
                ("rounds", "Burn Rounds", 4),
                ("cooldown", "Stretch", 2),
            ],
        }

        structure = STRUCTURES.get(goal, STRUCTURES["general_fitness"])

        # Difficulty → default reps/sets/work
        LEVEL_PARAMS = {
            "beginner": {"sets": 2, "reps": 8, "work": 30, "rest": 30},
            "intermediate": {"sets": 3, "reps": 12, "work": 40, "rest": 20},
            "advanced": {"sets": 4, "reps": 15, "work": 50, "rest": 15},
            "expert": {"sets": 5, "reps": 20, "work": 60, "rest": 10},
        }
        params = LEVEL_PARAMS.get(fitness_level, LEVEL_PARAMS["intermediate"])

        # Resolve style
        primary_style = None
        if style_slug:
            primary_style = MartialStyle.objects.filter(slug=style_slug).first()

        title_parts = []
        if goal:
            title_parts.append(goal.replace("_", " ").title())
        if primary_style:
            title_parts.append(primary_style.name)
        title_parts.append("Workout")
        title = " ".join(title_parts)

        workout = Workout.objects.create(
            title=title,
            slug=slugify(title) + "-" + uuid.uuid4().hex[:6],
            description=f"AI-generated {fitness_level} workout"
            + (f" for {goal.replace('_', ' ')}" if goal else "")
            + (f" ({gender}, age {age})" if gender and age else "")
            + f". Duration: ~{duration} min.",
            created_by=request.user,
            visibility="private",
            difficulty_level=fitness_level,
            estimated_duration_minutes=duration,
            primary_style=primary_style,
        )

        # Set M2M
        if muscle_slugs:
            bps = BodyPart.objects.filter(slug__in=muscle_slugs)
            workout.body_parts.set(bps)
        if equipment_slugs:
            eqs = Equipment.objects.filter(slug__in=equipment_slugs)
            workout.equipment_used.set(eqs)

        # Build blocks
        random.shuffle(available)
        ex_idx = 0
        for sort_order, (block_type, block_title, num_exercises) in enumerate(structure):
            block = WorkoutBlock.objects.create(
                workout=workout,
                block_type=block_type,
                title=block_title,
                sort_order=sort_order,
            )
            for ex_sort in range(num_exercises):
                if ex_idx >= len(available):
                    ex_idx = 0
                    random.shuffle(available)
                exercise = available[ex_idx]
                ex_idx += 1

                is_warmup = block_type in ("warmup", "cooldown")
                WorkoutExercise.objects.create(
                    workout_block=block,
                    exercise=exercise,
                    sort_order=ex_sort,
                    sets=params["sets"] if not is_warmup else 1,
                    reps=params["reps"] if not is_warmup else 10,
                    work_seconds=params["work"],
                    rest_seconds=params["rest"] if not is_warmup else params["rest"] + 10,
                )

        serializer = WorkoutDetailSerializer(workout, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
