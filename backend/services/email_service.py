# backend/services/email_service.py
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

User = get_user_model()


class EmailVerificationService:
    """Handle email verification for users"""

    @staticmethod
    def generate_verification_token(user):
        """Generate a verification token for a user"""
        from accounts.models import EmailVerificationToken

        # Invalidate any existing tokens
        EmailVerificationToken.objects.filter(user=user).delete()

        # Create new token
        token = EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(hours=24),
        )

        return token

    @staticmethod
    def send_verification_email(user):
        """Send verification email to user"""
        token = EmailVerificationService.generate_verification_token(user)

        verification_url = (
            f"https://{settings.INSTANCE_DOMAIN}/verify-email/{token.token}"
        )

        context = {
            "user": user,
            "verification_url": verification_url,
            "instance_name": settings.INSTANCE_NAME,
        }

        html_message = render_to_string("emails/verify_email.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"Verify your email on {settings.INSTANCE_NAME}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    @staticmethod
    def verify_token(token_string):
        """Verify a token and mark user as verified"""
        from accounts.models import EmailVerificationToken

        try:
            token = EmailVerificationToken.objects.get(
                token=token_string, expires_at__gt=timezone.now(), used=False
            )

            user = token.user
            user.email_verified = True
            user.save(update_fields=["email_verified"])

            token.used = True
            token.save(update_fields=["used"])

            return user
        except EmailVerificationToken.DoesNotExist:
            return None


class NotificationEmailService:
    """Handle notification emails"""

    @staticmethod
    def send_notification_email(notification):
        """Send email for a notification"""
        user = notification.recipient

        # Check if user has verified email
        if not user.email_verified:
            return

        context = {
            "user": user,
            "notification": notification,
            "instance_name": settings.INSTANCE_NAME,
            "site_url": f"https://{settings.INSTANCE_DOMAIN}",
        }

        html_message = render_to_string("emails/notification.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"New notification on {settings.INSTANCE_NAME}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,
        )


class PasswordResetEmailService:
    """Handle password reset emails"""

    @staticmethod
    def send_password_reset_email(user, reset_token):
        """Send password reset email"""
        reset_url = f"https://{settings.INSTANCE_DOMAIN}/reset-password/{reset_token}"

        context = {
            "user": user,
            "reset_url": reset_url,
            "instance_name": settings.INSTANCE_NAME,
        }

        html_message = render_to_string("emails/password_reset.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"Password reset for {settings.INSTANCE_NAME}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
