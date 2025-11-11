# backend/accounts/views.py
import logging
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from .models import EmailVerificationToken, Follow, User
from notifications.services import NotificationService
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import (
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from services.email_service import EmailVerificationService
from services.security_service import SecurityLoggingService, SessionManagementService
from services.validation_service import InputValidationService

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create auth token
        token, _created = Token.objects.get_or_create(user=user)

        # Send verification email — catch common network/SMTP failures but don't fail registration.
        # If EmailVerificationService documents its own exception class (e.g. EmailVerificationError),
        # prefer to catch that here instead.
        try:
            EmailVerificationService.send_verification_email(user)
        except (smtplib.SMTPException, ConnectionError, TimeoutError) as exc:
            logger.exception("Failed to send verification email for user id=%s: %s", user.pk, exc)
            # intentionally do not abort registration; user can request resend

        # Log successful registration
        ip_address = SessionManagementService.get_client_ip(request)
        SecurityLoggingService.log_login_attempt(
            username=user.username,
            ip_address=ip_address,
            success=True,
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            {
                "user": UserSerializer(user).data,
                "token": token.key,
                "message": "Registration successful. Please check your email to verify your account.",
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login endpoint"""
    username = request.data.get("username")
    password = request.data.get("password")
    ip_address = SessionManagementService.get_client_ip(request)

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for brute force attempts
    if SecurityLoggingService.check_brute_force(username, ip_address):
        return Response(
            {"error": "Too many failed login attempts. Please try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    user = authenticate(username=username, password=password)

    if user:
        # Log successful login
        SecurityLoggingService.log_login_attempt(
            username=username,
            ip_address=ip_address,
            success=True,
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        # Create session
        SessionManagementService.create_session(user, request)

        token, _created = Token.objects.get_or_create(user=user)

        return Response({"user": UserSerializer(user).data, "token": token.key})

    # Log failed login
    SecurityLoggingService.log_login_attempt(
        username=username,
        ip_address=ip_address,
        success=False,
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user and invalidate token"""

    # `request.user` is expected to be authenticated by permission class, but guard defensively.
    user = request.user
    if isinstance(user, AnonymousUser) or not getattr(user, "is_authenticated", False):
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

    # Delete token if it exists (no broad except; let unexpected errors surface during testing).
    token = getattr(user, "auth_token", None)
    if token is not None and hasattr(token, "delete"):
        # token.delete() should not normally raise, if it does, we want to see the traceback in tests/ops.
        token.delete()

    # Clear session (avoid swallowing unexpected exceptions here as well).
    # If your environment sometimes raises a known exception type on flush, catch that specific type.
    request.session.flush()

    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_email(request, token):
    """Verify user email with token"""
    user = EmailVerificationService.verify_token(token)

    if user:
        return Response(
            {
                "message": "Email verified successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {"error": "Invalid or expired verification token"},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def resend_verification_email(request):
    """Resend verification email"""
    user = request.user

    # The analyzer can't guarantee 'email_verified' exists on the user model,
    # so use getattr with a safe default.
    if getattr(user, "email_verified", False):
        return Response(
            {"message": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Catch the same set of expected email/network exceptions only.
    try:
        EmailVerificationService.send_verification_email(user)
        return Response(
            {"message": "Verification email sent"}, status=status.HTTP_200_OK
        )
    except (smtplib.SMTPException, ConnectionError, TimeoutError) as exc:
        logger.exception("Failed to resend verification email for user id=%s: %s", getattr(user, "pk", "<unknown>"), exc)
        return Response(
            {"error": "Failed to send verification email"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""

    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "username"

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        if self.kwargs.get("username") == "me":
            return self.request.user
        return super().get_object()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """Upload user avatar"""
    if "avatar" not in request.FILES:
        return Response(
            {"error": "No avatar file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    avatar_file = request.FILES["avatar"]

    try:
        # Validate avatar file
        InputValidationService.validate_image_file(avatar_file, is_avatar=True)

        # Save avatar
        user = request.user
        user.avatar = avatar_file
        user.save(update_fields=["avatar"])

        # Try to return a usable avatar URL; handle specific errors only
        avatar_url = None
        avatar_field = getattr(user, "avatar", None)
        if avatar_field and hasattr(avatar_field, "url"):
            try:
                # use absolute URL if possible
                avatar_url = request.build_absolute_uri(avatar_field.url)
            except (ValueError, TypeError) as exc:
                # fallback to the model property if present
                logger.warning("Could not build absolute URI for avatar for user id=%s: %s", getattr(user, "pk", "<unknown>"), exc)
                avatar_url = getattr(user, "avatar_url", None) or getattr(avatar_field, "url", None)

        return Response(
            {
                "success": True,
                "message": "Avatar uploaded successfully",
                "avatar_url": avatar_url,
            },
            status=status.HTTP_200_OK,
        )

    except ValidationError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, username):
    """Follow or unfollow a user"""
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if target_user == request.user:
        return Response({"error": "Cannot follow yourself"}, status=400)

    if request.method == "POST":
        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target_user
        )

        if created:
            # Create notification
            NotificationService.notify_follow(target_user, request.user)

            # TODO: Send federation follow request if remote user
            return Response({"following": True}, status=201)
        return Response({"following": True}, status=200)

    else:  # DELETE
        try:
            follow = Follow.objects.get(follower=request.user, following=target_user)
            follow.delete()
            # TODO: Send federation unfollow if remote user
            return Response({"following": False}, status=200)
        except Follow.DoesNotExist:
            return Response({"following": False}, status=200)