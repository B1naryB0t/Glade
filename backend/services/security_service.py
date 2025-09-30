# backend/services/security_service.py
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.cache import cache
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger("security")


class SecurityLoggingService:
    """Service for logging security events"""

    @staticmethod
    def log_login_attempt(username, ip_address, success, user_agent=None):
        """Log login attempt"""
        from accounts.models import LoginAttempt

        user = None
        if success:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                pass

        LoginAttempt.objects.create(
            user=user,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent or "",
            success=success,
        )

        logger.info(
            f"Login {'successful' if success else 'failed'} for {username} from {ip_address}"
        )

    @staticmethod
    def log_security_event(event_type, user, details, ip_address=None):
        """Log a security event"""
        from accounts.models import SecurityEvent

        SecurityEvent.objects.create(
            event_type=event_type,
            user=user,
            details=details,
            ip_address=ip_address or "",
        )

        logger.warning(
            f"Security event: {event_type} for user {user.username}: {details}"
        )

    @staticmethod
    def check_brute_force(username, ip_address):
        """Check for brute force login attempts"""
        from accounts.models import LoginAttempt

        # Check failed attempts in last 15 minutes
        recent_failures = LoginAttempt.objects.filter(
            username=username,
            ip_address=ip_address,
            success=False,
            created_at__gte=timezone.now() - timedelta(minutes=15),
        ).count()

        if recent_failures >= 5:
            logger.warning(
                f"Brute force detected: {recent_failures} failed attempts for {username} from {ip_address}"
            )
            return True

        return False

    @staticmethod
    def log_token_refresh(user, ip_address):
        """Log token refresh"""
        logger.info(f"Token refreshed for {user.username} from {ip_address}")

    @staticmethod
    def log_password_change(user, ip_address):
        """Log password change"""
        SecurityLoggingService.log_security_event(
            event_type="password_change",
            user=user,
            details="Password changed",
            ip_address=ip_address,
        )

    @staticmethod
    def log_email_change(user, old_email, new_email, ip_address):
        """Log email change"""
        SecurityLoggingService.log_security_event(
            event_type="email_change",
            user=user,
            details=f"Email changed from {old_email} to {new_email}",
            ip_address=ip_address,
        )


class SessionManagementService:
    """Service for managing user sessions"""

    @staticmethod
    def create_session(user, request):
        """Create a new session for user"""
        # Clear any existing sessions if needed
        if hasattr(request, "session"):
            request.session.cycle_key()

        # Store session metadata
        ip_address = SessionManagementService.get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]

        cache.set(
            f"session_meta:{request.session.session_key}",
            {
                "user_id": str(user.id),
                "ip_address": ip_address,
                "user_agent": user_agent,
                "created_at": timezone.now().isoformat(),
            },
            timeout=None,  # Will expire with session
        )

    @staticmethod
    def invalidate_all_sessions(user):
        """Invalidate all sessions for a user"""
        # Get all active sessions for user
        sessions = Session.objects.filter(expire_date__gte=timezone.now())

        for session in sessions:
            session_data = session.get_decoded()
            if session_data.get("_auth_user_id") == str(user.id):
                session.delete()

        logger.info(f"All sessions invalidated for user {user.username}")

    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip

    @staticmethod
    def validate_session(request):
        """Validate session is still valid"""
        if not request.user.is_authenticated:
            return False

        # Check if session has been hijacked (IP changed)
        session_key = request.session.session_key
        if not session_key:
            return False

        session_meta = cache.get(f"session_meta:{session_key}")
        if not session_meta:
            return True  # Old session without metadata, allow

        current_ip = SessionManagementService.get_client_ip(request)
        stored_ip = session_meta.get("ip_address")

        # If IP changed significantly, log it
        if stored_ip and current_ip != stored_ip:
            SecurityLoggingService.log_security_event(
                event_type="ip_change",
                user=request.user,
                details=f"IP changed from {stored_ip} to {current_ip}",
                ip_address=current_ip,
            )
            # Don't automatically log out, but log the event

        return True


class TokenManagementService:
    """Service for managing authentication tokens"""

    @staticmethod
    def is_token_valid(token):
        """Check if token is still valid"""
        from rest_framework.authtoken.models import Token

        try:
            token_obj = Token.objects.get(key=token)

            # Check if token has expired (if using token expiration)
            if hasattr(token_obj, "expires_at"):
                if token_obj.expires_at < timezone.now():
                    return False

            return True
        except Token.DoesNotExist:
            return False

    @staticmethod
    def refresh_token(user):
        """Refresh user's authentication token"""
        from rest_framework.authtoken.models import Token

        # Delete old token
        Token.objects.filter(user=user).delete()

        # Create new token
        token = Token.objects.create(user=user)

        return token
