# backend/notifications/services.py
from django.contrib.auth import get_user_model
from django.db import transaction
from models import Notification, NotificationPreference
from tasks import send_notification_email

User = get_user_model()


class NotificationService:
    """Service for creating and managing notifications"""

    @staticmethod
    def get_or_create_preferences(user):
        """Get or create notification preferences for a user"""
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        return preferences

    @staticmethod
    def should_notify(recipient, notification_type):
        """Check if user wants to receive this type of notification"""
        prefs = NotificationService.get_or_create_preferences(recipient)

        notification_map = {
            "like": prefs.notify_on_likes,
            "reply": prefs.notify_on_replies,
            "mention": prefs.notify_on_mentions,
            "follow": prefs.notify_on_follows,
            "follow_request": prefs.notify_on_follow_requests,
        }

        return notification_map.get(notification_type, True)

    @staticmethod
    def should_email(recipient, notification_type):
        """Check if user wants to receive email for this notification"""
        prefs = NotificationService.get_or_create_preferences(recipient)

        email_map = {
            "like": prefs.email_on_likes,
            "reply": prefs.email_on_replies,
            "mention": prefs.email_on_mentions,
            "follow": prefs.email_on_follows,
        }

        return email_map.get(notification_type, False)

    @staticmethod
    @transaction.atomic
    def create_notification(recipient, actor, notification_type, message, post=None):
        """Create a notification if user preferences allow it"""
        # Don't notify user about their own actions
        if recipient == actor:
            return None

        # Check if user wants this notification
        if not NotificationService.should_notify(recipient, notification_type):
            return None

        # Create notification
        notification = Notification.objects.create(
            recipient=recipient,
            actor=actor,
            notification_type=notification_type,
            message=message,
            post=post,
        )

        # Send email if preferences allow
        if NotificationService.should_email(recipient, notification_type):
            send_notification_email.delay(str(notification.id))

        return notification

    @staticmethod
    def notify_post_like(post, liker):
        """Notify post author about a like"""
        return NotificationService.create_notification(
            recipient=post.author,
            actor=liker,
            notification_type="like",
            message=f"{liker.display_name or liker.username} liked your post",
            post=post,
        )

    @staticmethod
    def notify_post_reply(post, replier, reply_post):
        """Notify post author about a reply"""
        return NotificationService.create_notification(
            recipient=post.author,
            actor=replier,
            notification_type="reply",
            message=f"{replier.display_name or replier.username} replied to your post",
            post=reply_post,
        )

    @staticmethod
    def notify_follow(followed_user, follower):
        """Notify user about a new follower"""
        return NotificationService.create_notification(
            recipient=followed_user,
            actor=follower,
            notification_type="follow",
            message=f"{follower.display_name or follower.username} started following you",
        )

    @staticmethod
    def mark_all_read(user):
        """Mark all notifications as read for a user"""
        Notification.objects.filter(recipient=user, read=False).update(read=True)
