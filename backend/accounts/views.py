# backend/accounts/views.py
import logging
import smtplib

import requests
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError
from django.db import models
from notifications.services import NotificationService
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from services.email_service import EmailVerificationService
from services.security_service import SecurityLoggingService, SessionManagementService
from services.validation_service import InputValidationService

from .models import EmailVerificationToken, Follow, User
from .serializers import (
    TimezoneListSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserSettingsSerializer,
)
from .throttles import RegistrationRateThrottle, ResendVerificationThrottle

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegistrationRateThrottle]

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
            logger.exception(
                "Failed to send verification email for user id=%s: %s", user.pk, exc
            )
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
        return Response(
            {"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
        )

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
    """Resend verification email with rate limiting"""
    from datetime import datetime

    from django.core.cache import cache

    user = request.user
    cache_key = f"resend_verification_{user.id}"

    # Check if user has recently requested a resend
    last_request = cache.get(cache_key)
    if last_request:
        return Response(
            {
                "error": "Please wait 5 minutes before requesting another verification email."
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # The analyzer can't guarantee 'email_verified' exists on the user model,
    # so use getattr with a safe default.
    if getattr(user, "email_verified", False):
        return Response(
            {"message": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Catch the same set of expected email/network exceptions only.
    try:
        EmailVerificationService.send_verification_email(user)

        # Set cache for 5 minutes (300 seconds)
        cache.set(cache_key, datetime.now().isoformat(), 300)

        return Response(
            {"message": "Verification email sent"}, status=status.HTTP_200_OK
        )
    except (smtplib.SMTPException, ConnectionError, TimeoutError) as exc:
        logger.exception(
            "Failed to resend verification email for user id=%s: %s",
            getattr(user, "pk", "<unknown>"),
            exc,
        )
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


class UserSettingsView(generics.RetrieveUpdateAPIView):
    """User settings management endpoint"""

    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Update user settings"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(
            {
                "message": "Settings updated successfully",
                "user": UserSerializer(instance).data,
            }
        )

    def partial_update(self, request, *args, **kwargs):
        """Partial update of user settings"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def timezone_list(request):
    """Get list of available timezones with their current offsets"""
    timezones = TimezoneListSerializer.get_timezone_list()

    # Optional filtering by search query
    search = request.query_params.get("search", "").lower()
    if search:
        timezones = [
            tz
            for tz in timezones
            if search in tz["timezone"].lower() or search in tz["display_name"].lower()
        ]

    return Response({"count": len(timezones), "timezones": timezones})


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
                logger.warning(
                    "Could not build absolute URI for avatar for user id=%s: %s",
                    getattr(user, "pk", "<unknown>"),
                    exc,
                )
                avatar_url = getattr(user, "avatar_url", None) or getattr(
                    avatar_field, "url", None
                )

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


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def follow_user_by_uri(request):
    """Follow a user by actor URI (for remote users with slashes in URI)"""
    actor_uri = request.data.get("actor_uri")
    if not actor_uri:
        return Response({"error": "actor_uri required"}, status=400)

    # Delegate to federation service for remote users
    from asgiref.sync import async_to_sync
    from federation.services import ActivityPubService

    try:
        ap_service = ActivityPubService()
        result = async_to_sync(ap_service.follow_remote_user)(request.user, actor_uri)
        return Response(result, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, username):
    """Follow or unfollow a user (local or remote)"""
    # Try local user first
    try:
        target_user = User.objects.get(username=username)
        is_remote = False
    except User.DoesNotExist:
        # Not a local user - treat as remote
        is_remote = True
        target_user = None

    if not is_remote:
        # Local user follow logic
        if target_user == request.user:
            return Response({"error": "Cannot follow yourself"}, status=400)


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, username):
    """Follow or unfollow a user (local or remote)"""
    # Try local user first
    try:
        target_user = User.objects.get(username=username)
        is_remote = False
    except User.DoesNotExist:
        # Not a local user - treat as remote
        is_remote = True
        target_user = None

    if not is_remote:
        # Local user follow logic
        if target_user == request.user:
            return Response({"error": "Cannot follow yourself"}, status=400)

        if request.method == "POST":
            # Auto-accept only for public profiles (privacy_level = 1)
            auto_accept = target_user.privacy_level == 1

            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=target_user,
                defaults={"accepted": auto_accept},
            )

            if created:
                # Create notification (catch errors if Celery/Redis unavailable)
                try:
                    if auto_accept:
                        NotificationService.notify_follow(target_user, request.user)
                    else:
                        NotificationService.notify_follow_request(
                            target_user, request.user
                        )
                except Exception as e:
                    print(f"Notification failed: {e}")

                status_message = "following" if auto_accept else "requested"
                return Response(
                    {
                        "following": auto_accept,
                        "requested": not auto_accept,
                        "status": status_message,
                    },
                    status=201,
                )

            # If already exists, return current status
            return Response(
                {
                    "following": follow.accepted,
                    "requested": not follow.accepted,
                    "status": "following" if follow.accepted else "requested",
                },
                status=200,
            )

        else:  # DELETE
            try:
                follow = Follow.objects.get(
                    follower=request.user, following=target_user
                )
                follow.delete()
                # TODO: Send federation unfollow if remote user
                return Response({"following": False}, status=200)
            except Follow.DoesNotExist:
                return Response({"following": False}, status=200)

    else:
        # Remote user follow - delegate to federation service
        from asgiref.sync import async_to_sync
        from federation.services import ActivityPubService

        if request.method == "POST":
            try:
                ap_service = ActivityPubService()
                result = async_to_sync(ap_service.follow_remote_user)(
                    request.user, username
                )
                return Response(result, status=201)
            except Exception as e:
                return Response({"error": str(e)}, status=500)
        else:  # DELETE
            return Response(
                {"error": "Unfollow remote users not yet implemented"}, status=501
            )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """Search for users by username with pagination"""
    query = request.query_params.get("q", "").strip()
    page = int(request.query_params.get("page", 1))
    page_size = 10

    if not query or len(query) < 2:
        return Response({"results": [], "count": 0, "total": 0, "page": 1, "pages": 0})

    # Search by username or display_name, respecting privacy levels
    # Privacy level 1 (Public): searchable by everyone
    # Privacy level 2 (Local): searchable by local users only
    # Privacy level 3 (Private): not searchable
    all_users = User.objects.filter(
        models.Q(username__icontains=query) | models.Q(display_name__icontains=query),
        privacy_level__in=[1, 2],  # Public and Local profiles are searchable
    ).exclude(id=request.user.id)

    total_count = all_users.count()
    total_pages = (total_count + page_size - 1) // page_size  # Ceiling division

    # Paginate results
    start = (page - 1) * page_size
    end = start + page_size
    users = all_users[start:end]

    serializer = UserSerializer(users, many=True, context={"request": request})
    return Response(
        {
            "results": serializer.data,
            "count": len(serializer.data),
            "total": total_count,
            "page": page,
            "pages": total_pages,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def follow_requests(request):
    """Get pending follow requests for the authenticated user"""
    pending_follows = Follow.objects.filter(
        following=request.user, accepted=False
    ).select_related("follower")

    requests_data = [
        {
            "id": str(follow.id),
            "follower": UserSerializer(follow.follower).data,
            "created_at": follow.created_at,
        }
        for follow in pending_follows
    ]

    return Response({"requests": requests_data}, status=200)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def accept_follow_request(request, follow_id):
    """Accept a follow request"""
    try:
        follow = Follow.objects.get(
            id=follow_id, following=request.user, accepted=False
        )
        follow.accepted = True
        follow.save()

        # Notify the follower that their request was accepted
        try:
            NotificationService.notify_follow_accepted(follow.follower, request.user)
        except Exception as e:
            print(f"Notification failed: {e}")

        return Response({"message": "Follow request accepted"}, status=200)
    except Follow.DoesNotExist:
        return Response({"error": "Follow request not found"}, status=404)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def reject_follow_request(request, follow_id):
    """Reject a follow request"""
    try:
        follow = Follow.objects.get(
            id=follow_id, following=request.user, accepted=False
        )
        follow.delete()

        return Response({"message": "Follow request rejected"}, status=200)
    except Follow.DoesNotExist:
        return Response({"error": "Follow request not found"}, status=404)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_followers(request, username):
    """Get list of users following the specified user"""
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Get accepted followers
    followers = Follow.objects.filter(following=user, accepted=True).select_related(
        "follower"
    )

    followers_data = [
        UserSerializer(follow.follower, context={"request": request}).data
        for follow in followers
    ]

    return Response(
        {"results": followers_data, "count": len(followers_data)}, status=200
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_following(request, username):
    """Get list of users that the specified user is following"""
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Get accepted follows
    following = Follow.objects.filter(follower=user, accepted=True).select_related(
        "following"
    )

    following_data = [
        UserSerializer(follow.following, context={"request": request}).data
        for follow in following
    ]

    return Response(
        {"results": following_data, "count": len(following_data)}, status=200
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_ip_location(request):
    """Get approximate location from IP address"""
    import requests

    ip_address = SessionManagementService.get_client_ip(request)

    logger.info(f"IP location request from IP: {ip_address}")

    # Check if it's a private/localhost IP
    is_private_ip = (
        ip_address in ["127.0.0.1", "localhost", "::1"]
        or ip_address.startswith("10.")
        or ip_address.startswith("192.168.")
        or ip_address.startswith("172.16.")
        or ip_address.startswith("172.17.")
        or ip_address.startswith("172.18.")
        or ip_address.startswith("172.19.")
        or ip_address.startswith("172.2")
        or ip_address.startswith("172.30.")
        or ip_address.startswith("172.31.")
    )

    if is_private_ip:
        logger.info(
            f"Private/localhost IP detected: {ip_address}, returning default location"
        )
        return Response(
            {
                "latitude": 35.305690,
                "longitude": -80.732181,
                "city": "Charlotte",
                "region": "North Carolina",
                "country": "United States",
            },
            status=status.HTTP_200_OK,
        )

    try:
        # Using ip-api.com free tier (no API key needed)
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=10)

        logger.info(f"IP-API response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            logger.info(
                f"IP-API response: status={data.get('status')}, message={data.get('message')}"
            )

            if data.get("status") == "success":
                logger.info(
                    f"Successfully geolocated {ip_address} to {data.get('city')}, {data.get('regionName')}"
                )
                return Response(
                    {
                        "latitude": data.get("lat"),
                        "longitude": data.get("lon"),
                        "city": data.get("city"),
                        "region": data.get("regionName"),
                        "country": data.get("country"),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                logger.warning(
                    f"IP-API returned failure: {data.get('message')} for IP {ip_address}"
                )

        # Fallback to default location
        logger.warning(
            f"IP geolocation failed for {ip_address}, returning default location"
        )
        return Response(
            {
                "latitude": 35.305690,
                "longitude": -80.732181,
                "city": "Charlotte",
                "region": "North Carolina",
                "country": "United States",
            },
            status=status.HTTP_200_OK,
        )
    except requests.RequestException as e:
        logger.error(f"IP geolocation request failed for {ip_address}: {e}")
        # Return default location instead of error
        return Response(
            {
                "latitude": 35.305690,
                "longitude": -80.732181,
                "city": "Charlotte",
                "region": "North Carolina",
                "country": "United States",
            },
            status=status.HTTP_200_OK,
        )


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
def user_settings(request):
    """Get or update user settings"""
    user = request.user

    if request.method == "GET":
        # Return user settings mapped to frontend expectations
        privacy_map = {1: "public", 2: "local", 3: "followers", 4: "private"}

        # Extract lat/lng from approximate_location if it exists
        latitude = None
        longitude = None
        if user.approximate_location:
            longitude = user.approximate_location.x
            latitude = user.approximate_location.y

        return Response(
            {
                "username": user.username,
                "email": user.email,
                "email_verified": user.email_verified,
                "bio": user.bio or "",
                "latitude": latitude,
                "longitude": longitude,
                "profile_visibility": privacy_map.get(user.privacy_level, "public"),
                "default_post_privacy": "public",  # TODO: Add to user model
                "email_notifications": True,  # TODO: Get from notification preferences
                "browser_notifications": False,
            }
        )

    elif request.method == "PUT":
        # Update user settings
        from django.contrib.gis.geos import Point

        data = request.data

        if "display_name" in data:
            user.display_name = data["display_name"]
        if "bio" in data:
            user.bio = data["bio"]
        if "privacy_level" in data:
            user.privacy_level = data["privacy_level"]
        if "location_privacy_radius" in data:
            user.location_privacy_radius = data["location_privacy_radius"]

        # Update location if provided
        if "latitude" in data and "longitude" in data:
            lat = data["latitude"]
            lng = data["longitude"]
            if lat is not None and lng is not None:
                from privacy.services import PrivacyService

                privacy_service = PrivacyService()
                fuzzed_lat, fuzzed_lng = privacy_service.apply_location_privacy(
                    lat, lng, user.privacy_level
                )
                user.approximate_location = Point(fuzzed_lng, fuzzed_lat)
            else:
                user.approximate_location = None

        user.save()

        return Response(
            {
                "message": "Settings updated successfully",
                "user": UserSerializer(user).data,
            }
        )


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    """Delete user account and all associated data"""
    user = request.user

    # Require password confirmation for security
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password confirmation required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify password
    if not user.check_password(password):
        return Response(
            {"error": "Invalid password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Log the account deletion
    ip_address = SessionManagementService.get_client_ip(request)
    logger.info(
        f"User {user.username} (id={user.pk}) deleted their account from IP {ip_address}"
    )

    # Delete the user (cascade will handle related objects via Django ORM)
    username = user.username
    user.delete()

    return Response(
        {"message": f"Account {username} has been permanently deleted"},
        status=status.HTTP_200_OK,
    )
