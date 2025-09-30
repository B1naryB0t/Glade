# backend/notifications/tasks.py
from celery import shared_task
from django.contrib.auth import get_user_model
from services.email_service import NotificationEmailService

from .models import Notification

User = get_user_model()


@shared_task
def send_notification_email(notification_id):
    """Send email for a notification"""
    try:
        notification = Notification.objects.get(id=notification_id)

        if notification.emailed:
            return  # Already sent

        # Send email
        NotificationEmailService.send_notification_email(notification)

        # Mark as emailed
        notification.emailed = True
        notification.save(update_fields=["emailed"])

    except Notification.DoesNotExist:
        pass
    except Exception as e:
        print(f"Failed to send notification email: {e}")


@shared_task
def cleanup_old_notifications():
    """Clean up old read notifications (older than 30 days)"""
    from datetime import timedelta

    from django.utils import timezone

    cutoff_date = timezone.now() - timedelta(days=30)

    deleted_count = Notification.objects.filter(
        read=True, created_at__lt=cutoff_date
    ).delete()[0]

    print(f"Cleaned up {deleted_count} old notifications")


@shared_task
def cleanup_old_login_attempts():
    """Clean up old login attempts (older than 30 days)"""
    from datetime import timedelta

    from accounts.models import LoginAttempt
    from django.utils import timezone

    cutoff_date = timezone.now() - timedelta(days=30)

    deleted_count = LoginAttempt.objects.filter(created_at__lt=cutoff_date).delete()[0]

    print(f"Cleaned up {deleted_count} old login attempts")
