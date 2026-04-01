from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("events", views.CalendarEventViewSet, basename="calendar-event")
router.register("scheduled-quick-trainings", views.ScheduledQuickTrainingViewSet, basename="scheduled-quick-training")
router.register("scheduled-workouts", views.ScheduledWorkoutViewSet, basename="scheduled-workout")

urlpatterns = [
    path("", include(router.urls)),
    path("week/", views.CalendarWeekView.as_view(), name="calendar-week"),
]
