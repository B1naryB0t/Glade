# backend/accounts/serializers.py
import pytz
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""

    password = serializers.CharField(
        write_only=True, min_length=8, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password",
                  "password_confirm", "display_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def validate_timezone(self, value):
        """Validate that the timezone is valid"""
        if value and value not in pytz.all_timezones:
            raise serializers.ValidationError("Invalid timezone")
        return value

    def validate_username(self, value):
        """Validate and sanitize username"""
        from services.validation_service import InputValidationService

        return InputValidationService.validate_username(value)

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        from privacy.services import PrivacyService

        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)

        # Set default location (UNC Charlotte) with fuzzing applied
        default_lat = 35.305690
        default_lng = -80.732181
        privacy_service = PrivacyService()
        fuzzed_lat, fuzzed_lng = privacy_service.apply_location_privacy(
            default_lat, default_lng, user.privacy_level
        )
        user.approximate_location = Point(fuzzed_lng, fuzzed_lat)
        user.save(update_fields=["approximate_location"])

        return user


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer"""

    avatar_url = serializers.ReadOnlyField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "display_name",
            "bio",
            "avatar_url",
            "timezone",
            "email_verified",
            "created_at",
            "followers_count",
            "following_count",
            "posts_count",
        ]

    @staticmethod
    def get_followers_count(obj):
        return obj.followers.filter(accepted=True).count()

    @staticmethod
    def get_following_count(obj):
        return obj.following.filter(accepted=True).count()

    @staticmethod
    def get_posts_count(obj):
        return obj.posts.filter(visibility__in=[1, 2]).count()


class UserProfileSerializer(serializers.ModelSerializer):
    """Extended user profile serializer"""

    avatar_url = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    is_follower = serializers.SerializerMethodField()
    follow_requested = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "display_name",
            "bio",
            "avatar_url",
            "privacy_level",
            "location_privacy_radius",
            "federation_enabled",
            "created_at",
            "is_following",
            "is_follower",
            "follow_requested",
            "followers_count",
            "following_count",
        ]
        read_only_fields = ["id", "username", "created_at"]

    def validate_timezone(self, value):
        """Validate that the timezone is valid"""
        if value and value not in pytz.all_timezones:
            raise serializers.ValidationError("Invalid timezone")
        return value

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user, accepted=True).exists()
        return False

    def get_is_follower(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.following.filter(following=request.user, accepted=True).exists()
        return False

    def get_follow_requested(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user, accepted=False).exists()
        return False

    def get_followers_count(self, obj):
        return obj.followers.filter(accepted=True).count()

    def get_following_count(self, obj):
        return obj.following.filter(accepted=True).count()

    def validate_display_name(self, value):
        """Validate and sanitize display name"""
        from services.validation_service import InputValidationService

        return InputValidationService.validate_display_name(value)

    def validate_bio(self, value):
        """Validate and sanitize bio"""
        from services.validation_service import InputValidationService

        return InputValidationService.validate_bio(value)


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer specifically for user settings updates"""

    class Meta:
        model = User
        fields = [
            "display_name",
            "bio",
            "timezone",
            "privacy_level",
            "location_privacy_radius",
            "federation_enabled",
        ]

    def validate_timezone(self, value):
        """Validate that the timezone is valid"""
        if value and value not in pytz.all_timezones:
            raise serializers.ValidationError("Invalid timezone")
        return value

    def validate_location_privacy_radius(self, value):
        """Validate location privacy radius is within acceptable range"""
        from django.conf import settings

        if value < 0:
            raise serializers.ValidationError(
                "Privacy radius must be positive")
        if value > settings.MAX_LOCATION_RADIUS:
            raise serializers.ValidationError(
                f"Privacy radius cannot exceed {settings.MAX_LOCATION_RADIUS} meters"
            )
        return value


class TimezoneListSerializer(serializers.Serializer):
    """Serializer for returning available timezones"""

    timezone = serializers.CharField()
    display_name = serializers.CharField()
    offset = serializers.CharField()

    @staticmethod
    def get_timezone_list():
        """Return a list of common timezones with their current offsets"""
        import datetime

        from django.utils import timezone as django_tz

        now = django_tz.now()
        timezones = []

        for tz_name in pytz.common_timezones:
            tz = pytz.timezone(tz_name)
            offset = now.astimezone(tz).strftime("%z")
            # Format offset as +HH:MM or -HH:MM
            if offset:
                offset_formatted = f"UTC{offset[:3]}:{offset[3:]}"
            else:
                offset_formatted = "UTC+00:00"

            timezones.append(
                {
                    "timezone": tz_name,
                    "display_name": tz_name.replace("_", " "),
                    "offset": offset_formatted,
                }
            )

        return sorted(timezones, key=lambda x: x["offset"])
