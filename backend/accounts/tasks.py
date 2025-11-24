# backend/accounts/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import PasswordResetToken, EmailVerificationToken
import logging

logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_tokens():
    """
    Cleanup expired password reset and email verification tokens.
    Should be run periodically (e.g., daily via celery beat).
    """
    now = timezone.now()
    
    # Delete expired password reset tokens
    expired_reset = PasswordResetToken.objects.filter(expires_at__lt=now).delete()
    logger.info(f"Deleted {expired_reset[0]} expired password reset tokens")
    
    # Delete expired email verification tokens
    expired_verification = EmailVerificationToken.objects.filter(expires_at__lt=now).delete()
    logger.info(f"Deleted {expired_verification[0]} expired email verification tokens")
    
    return {
        "password_reset_tokens_deleted": expired_reset[0],
        "email_verification_tokens_deleted": expired_verification[0],
    }
