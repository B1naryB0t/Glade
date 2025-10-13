# backend/notifications/models.py
import uuid
from django.conf import settings
from django.db import models


class NotificationPreference(models.Model):
    """User notification preferences"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Reaction notifications
    notify_on_likes = models.BooleanField(default=True)
    notify_on_replies = models.BooleanField(default=True)
    notify_on_mentions = models.BooleanField(default=True)

    # Follow notifications
    notify_on_follows = models.BooleanField(default=True)
    notify_on_follow_requests = models.BooleanField(default=True)

    # Email preferences
    email_on_likes = models.BooleanField(default=False)
    email_on_replies = models.BooleanField(default=True)
    email_on_mentions = models.BooleanField(default=True)
    email_on_follows = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"


class Notification(models.Model):
    """User notifications"""

    NOTIFICATION_TYPES = [
        ("like", "Like"),
        ("reply", "Reply"),
        ("mention", "Mention"),
        ("follow", "Follow"),
        ("follow_request", "Follow Request"),
        ("follow_accepted", "Follow Accepted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="actions"
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)

    # Related objects (optional)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Notification content
    message = models.TextField()

    # Status
    read = models.BooleanField(default=False)
    emailed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["recipient", "read"]),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"

    def mark_as_read(self):
        """Mark notification as read"""
        self.read = True
        self.save(update_fields=["read"])
