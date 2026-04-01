from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from apps.media_library.views import ExerciseMediaListCreateView

router = DefaultRouter()
router.register("", views.ExerciseViewSet, basename="exercise")

urlpatterns = [
    path("<int:exercise_id>/media/", ExerciseMediaListCreateView.as_view(), name="exercise-media"),
    path("", include(router.urls)),
]
