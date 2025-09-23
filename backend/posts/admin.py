from django.contrib import admin

from models import Like, Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "author",
        "content_preview",
        "visibility",
        "local_only",
        "created_at",
    )
    list_filter = ("visibility", "local_only", "created_at")
    search_fields = ("content", "author__username")
    readonly_fields = ("activity_id", "created_at", "updated_at")

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "Content"


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")
    list_filter = ("created_at",)
