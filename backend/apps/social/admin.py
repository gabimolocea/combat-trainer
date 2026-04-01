from django.contrib import admin
from .models import PartnerRelation, FollowRelation


@admin.register(PartnerRelation)
class PartnerRelationAdmin(admin.ModelAdmin):
    list_display = ["requester", "addressee", "status", "created_at"]
    list_filter = ["status"]
    raw_id_fields = ["requester", "addressee"]


@admin.register(FollowRelation)
class FollowRelationAdmin(admin.ModelAdmin):
    list_display = ["follower", "followed_user", "created_at"]
    raw_id_fields = ["follower", "followed_user"]
