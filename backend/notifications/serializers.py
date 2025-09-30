# backend/notifications/serializers.py
from accounts.serializers import UserSerializer
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Notification, NotificationPreference
from .serializers import NotificationPreferenceSerializer, NotificationSerializer
from .services import NotificationService


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


# backend/notifications/views.py


class NotificationListView(generics.ListAPIView):
    """List user notifications"""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "actor", "post"
        )


class UnreadNotificationListView(generics.ListAPIView):
    """List unread notifications"""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user, read=False
        ).select_related("actor", "post")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a single notification as read"""
    try:
        notification = Notification.objects.get(
            id=notification_id, recipient=request.user
        )
        notification.mark_as_read()
        return Response(
            {"message": "Notification marked as read"}, status=status.HTTP_200_OK
        )
    except Notification.DoesNotExist:
        return Response(
            {"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    NotificationService.mark_all_read(request.user)
    return Response(
        {"message": "All notifications marked as read"}, status=status.HTTP_200_OK
    )


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """Get and update notification preferences"""

    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prefs, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return prefs


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def notification_count(request):
    """Get count of unread notifications"""
    count = Notification.objects.filter(recipient=request.user, read=False).count()

    return Response({"unread_count": count})
