from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("sessions", views.WorkoutSessionViewSet, basename="session")

urlpatterns = [
    path("stats/", views.StatsView.as_view(), name="tracking-stats"),
    path("", include(router.urls)),
]
