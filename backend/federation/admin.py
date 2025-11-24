# backend/federation/admin.py
from django.contrib import admin

from .models import Activity, RemoteInstance, RemoteUser


@admin.register(RemoteInstance)
class RemoteInstanceAdmin(admin.ModelAdmin):
    list_display = (
        "domain",
        "software",
        "version",
        "trust_level",
        "user_count",
        "last_seen_at",
    )
    list_filter = ("trust_level", "software")
    search_fields = ("domain",)
    readonly_fields = ("created_at", "last_seen_at")


@admin.register(RemoteUser)
class RemoteUserAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "display_name",
        "instance",
        "actor_uri",
        "last_fetched_at",
    )
    list_filter = ("instance",)
    search_fields = ("username", "display_name", "actor_uri")
    readonly_fields = ("created_at", "last_fetched_at")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        "activity_type",
        "direction",
        "actor_uri",
        "processed",
        "created_at",
    )
    list_filter = ("activity_type", "direction", "processed", "created_at")
    search_fields = ("activity_id", "actor_uri", "object_uri")
    readonly_fields = ("created_at", "raw_activity")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
