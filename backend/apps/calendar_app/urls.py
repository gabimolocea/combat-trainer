from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("events", views.CalendarEventViewSet, basename="calendar-event")

urlpatterns = [
    path("", include(router.urls)),
]
