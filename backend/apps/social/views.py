from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import PartnerRelation, FollowRelation
from .serializers import PartnerRelationSerializer, PartnerInviteSerializer, FollowRelationSerializer

User = get_user_model()


class PartnerListView(generics.ListAPIView):
    serializer_class = PartnerRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartnerRelation.objects.filter(
            Q(requester=self.request.user) | Q(addressee=self.request.user)
        ).select_related("requester", "addressee")


class PartnerInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Accept either user_id or addressee_username
        username = request.data.get("addressee_username")
        user_id = request.data.get("user_id")

        if username:
            try:
                addressee = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        elif user_id:
            if user_id == request.user.id:
                return Response(
                    {"error": "Cannot partner with yourself."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                addressee = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Provide addressee_username or user_id."}, status=status.HTTP_400_BAD_REQUEST)

        if addressee == request.user:
            return Response(
                {"error": "Cannot partner with yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = PartnerRelation.objects.filter(
            Q(requester=request.user, addressee=addressee)
            | Q(requester=addressee, addressee=request.user)
        ).first()

        if existing:
            return Response(
                {"error": "Partner relation already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relation = PartnerRelation.objects.create(
            requester=request.user, addressee=addressee
        )
        return Response(
            PartnerRelationSerializer(relation).data,
            status=status.HTTP_201_CREATED,
        )


class PartnerAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            relation = PartnerRelation.objects.get(id=pk, addressee=request.user)
        except PartnerRelation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        relation.status = "accepted"
        relation.save()
        return Response(PartnerRelationSerializer(relation).data)


class PartnerDeclineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            relation = PartnerRelation.objects.get(id=pk, addressee=request.user)
        except PartnerRelation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        relation.status = "declined"
        relation.save()
        return Response(PartnerRelationSerializer(relation).data)


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FollowRelation.objects.filter(
            follower=self.request.user
        ).select_related("follower", "followed_user")


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FollowRelation.objects.filter(
            followed_user=self.request.user
        ).select_related("follower", "followed_user")


class FollowCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response({"error": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if target == request.user:
            return Response({"error": "Cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        relation, created = FollowRelation.objects.get_or_create(
            follower=request.user, followed_user=target
        )
        if not created:
            return Response({"status": "already following"})
        return Response(
            FollowRelationSerializer(relation).data,
            status=status.HTTP_201_CREATED,
        )


class FollowDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        deleted, _ = FollowRelation.objects.filter(
            follower=request.user, followed_user_id=user_id
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
