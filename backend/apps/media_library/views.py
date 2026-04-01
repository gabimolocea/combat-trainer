from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.exercises.models import Exercise
from .models import ExerciseMedia
from .serializers import ExerciseMediaSerializer, ExerciseMediaUploadSerializer


class ExerciseMediaListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseMedia.objects.filter(exercise_id=self.kwargs["exercise_id"])

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ExerciseMediaUploadSerializer
        return ExerciseMediaSerializer

    def perform_create(self, serializer):
        exercise = Exercise.objects.get(id=self.kwargs["exercise_id"])
        if exercise.created_by != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add media to your own exercises.")
        serializer.save(exercise=exercise)
