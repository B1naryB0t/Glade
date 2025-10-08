# backend/notifications/serializers.py
from accounts.serializers import UserSerializer
from rest_framework import serializers

from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""

    actor = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "notification_type",
            "message",
            "read",
            "created_at",
            "post",
        ]
        read_only_fields = [
            "id",
            "actor",
            "notification_type",
            "message",
            "created_at",
            "post",
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""

    class Meta:
        model = NotificationPreference
        fields = [
            "notify_on_likes",
            "notify_on_replies",
            "notify_on_mentions",
            "notify_on_follows",
            "notify_on_follow_requests",
            "email_on_likes",
            "email_on_replies",
            "email_on_mentions",
            "email_on_follows",
        ]
