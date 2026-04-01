from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["reporter", "report_type", "target_id", "status", "created_at"]
    list_filter = ["report_type", "status"]
    raw_id_fields = ["reporter", "reviewed_by"]
