from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.MyProfileView.as_view(), name="profile-me"),
    path("<int:user_id>/", views.PublicProfileView.as_view(), name="profile-public"),
]
