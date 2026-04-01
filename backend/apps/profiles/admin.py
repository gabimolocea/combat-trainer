from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "display_name", "experience_level", "visibility", "created_at"]
    list_filter = ["experience_level", "visibility"]
    search_fields = ["user__email", "user__username", "display_name"]
    raw_id_fields = ["user"]
