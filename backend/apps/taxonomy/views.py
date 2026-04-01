from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import MartialStyle, WorkoutType, BodyPart, Equipment, Tag, TrainingType
from .serializers import (
    MartialStyleSerializer, WorkoutTypeSerializer,
    BodyPartSerializer, EquipmentSerializer, TagSerializer,
    TrainingTypeSerializer,
)


class MartialStyleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MartialStyle.objects.filter(is_active=True)
    serializer_class = MartialStyleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class WorkoutTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkoutType.objects.all()
    serializer_class = WorkoutTypeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class BodyPartViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BodyPart.objects.all()
    serializer_class = BodyPartSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class EquipmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class TrainingTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TrainingType.objects.all()
    serializer_class = TrainingTypeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

