# backend/accounts/serializers.py
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User
from rest_framework import serializers


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "display_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def validate_username(self, value):
        """Validate and sanitize username"""
        from services.validation_service import InputValidationService
        return InputValidationService.validate_username(value)

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
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
            "created_at",
            "followers_count",
            "following_count",
            "posts_count",
        ]

    def get_followers_count(self, obj):
        return obj.followers.filter(accepted=True).count()

    def get_following_count(self, obj):
        return obj.following.filter(accepted=True).count()

    def get_posts_count(self, obj):
        return obj.posts.filter(visibility__in=[1, 2]).count()


class UserProfileSerializer(serializers.ModelSerializer):
    """Extended user profile serializer"""

    avatar_url = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    is_follower = serializers.SerializerMethodField()

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
        ]
        read_only_fields = ["id", "username", "created_at"]

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

    def validate_display_name(self, value):
        """Validate and sanitize display name"""
        from services.validation_service import InputValidationService
        return InputValidationService.validate_display_name(value)

    def validate_bio(self, value):
        """Validate and sanitize bio"""
        from services.validation_service import InputValidationService
        return InputValidationService.validate_bio(value)
