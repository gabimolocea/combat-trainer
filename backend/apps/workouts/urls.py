from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("", views.WorkoutViewSet, basename="workout")

urlpatterns = [
    path("generate/", views.GenerateWorkoutView.as_view(), name="workout-generate"),
    path("", include(router.urls)),
]
