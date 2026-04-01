from django.contrib import admin
from .models import CalendarEvent, EventInviteResponse


class EventInviteResponseInline(admin.TabularInline):
    model = EventInviteResponse
    extra = 0
    raw_id_fields = ["user"]


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ["title", "event_type", "status", "starts_at", "owner"]
    list_filter = ["event_type", "status"]
    search_fields = ["title"]
    raw_id_fields = ["owner", "created_by", "workout"]
    inlines = [EventInviteResponseInline]
