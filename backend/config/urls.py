from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/profiles/", include("apps.profiles.urls")),
    path("api/v1/taxonomy/", include("apps.taxonomy.urls")),
    path("api/v1/exercises/", include("apps.exercises.urls")),
    path("api/v1/workouts/", include("apps.workouts.urls")),
    path("api/v1/plans/", include("apps.plans.urls")),
    path("api/v1/calendar/", include("apps.calendar_app.urls")),
    path("api/v1/social/", include("apps.social.urls")),
    path("api/v1/tracking/", include("apps.tracking.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
