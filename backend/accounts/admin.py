# backend/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from models import Follow, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "display_name",
        "privacy_level",
        "federation_enabled",
        "created_at",
    )
    list_filter = ("privacy_level", "federation_enabled", "created_at")
    fieldsets = list(UserAdmin.fieldsets) + [
        ("Profile", {"fields": ("display_name", "bio", "avatar")}),
        (
            "Privacy",
            {
                "fields": (
                    "privacy_level",
                    "location_privacy_radius",
                    "approximate_location",
                )
            },
        ),
        ("Federation", {"fields": ("federation_enabled", "actor_uri")}),
    ]


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "accepted", "created_at")
    list_filter = ("accepted", "created_at")
