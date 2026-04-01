from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfilePublicSerializer


class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={"display_name": self.request.user.username},
        )
        return profile


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfilePublicSerializer
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.select_related("user").filter(
        visibility=UserProfile.Visibility.PUBLIC
    )
    lookup_field = "user_id"
