from rest_framework import serializers
from .models import MartialStyle, WorkoutType, BodyPart, Equipment, Tag


class MartialStyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MartialStyle
        fields = ["id", "name", "slug", "description", "is_active"]


class WorkoutTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutType
        fields = ["id", "name", "slug", "description"]


class BodyPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyPart
        fields = ["id", "name", "slug"]


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ["id", "name", "slug", "description"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
