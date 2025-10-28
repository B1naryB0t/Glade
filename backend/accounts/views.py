# backend/accounts/views.py
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
        token, created = Token.objects.get_or_create(user=user)

        # Send verification email
        try:
            EmailVerificationService.send_verification_email(user)
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send verification email: {e}")

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

        token, created = Token.objects.get_or_create(user=user)

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
    try:
        # Delete token
        request.user.auth_token.delete()

        # Clear session
        request.session.flush()

        return Response(
            {"message": "Logged out successfully"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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

    if user.email_verified:
        return Response(
            {"message": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        EmailVerificationService.send_verification_email(user)
        return Response(
            {"message": "Verification email sent"}, status=status.HTTP_200_OK
        )
    except Exception as e:
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

        return Response(
            {
                "success": True,
                "message": "Avatar uploaded successfully",
                "avatar_url": user.avatar_url,
            },
            status=status.HTTP_200_OK,
        )

    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
