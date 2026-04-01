from rest_framework import serializers
from .models import PartnerRelation, FollowRelation
from apps.users.serializers import UserMinimalSerializer


class PartnerRelationSerializer(serializers.ModelSerializer):
    requester = UserMinimalSerializer(read_only=True)
    addressee = UserMinimalSerializer(read_only=True)

    class Meta:
        model = PartnerRelation
        fields = ["id", "requester", "addressee", "status", "created_at", "updated_at"]


class PartnerInviteSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class FollowRelationSerializer(serializers.ModelSerializer):
    follower = UserMinimalSerializer(read_only=True)
    followed_user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = FollowRelation
        fields = ["id", "follower", "followed_user", "created_at"]
