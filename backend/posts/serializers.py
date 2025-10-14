# backend/posts/serializers.py
from accounts.serializers import UserSerializer
from django.contrib.gis.geos import Point
from .models import Post
from backend.privacy.services import PrivacyService
from rest_framework import serializers


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""

    location = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ["content", "content_warning", "visibility", "local_only", "location"]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user

        # Handle location privacy
        location_data = validated_data.pop("location", None)
        location_point = None

        if location_data and isinstance(location_data, dict):
            lat = location_data.get("latitude")
            lng = location_data.get("longitude")

            if lat is not None and lng is not None:
                # Apply privacy fuzzing
                privacy_service = PrivacyService()
                fuzzed_lat, fuzzed_lng = privacy_service.apply_location_privacy(
                    lat, lng, user.privacy_level
                )
                location_point = Point(fuzzed_lng, fuzzed_lat)

        post = Post.objects.create(
            author=user, location=location_point, **validated_data
        )

        return post


class PostSerializer(serializers.ModelSerializer):
    """Serializer for displaying posts"""

    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    location_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "content_warning",
            "visibility",
            "local_only",
            "location_name",
            "created_at",
            "updated_at",
            "likes_count",
            "replies_count",
            "is_liked",
        ]

    @staticmethod
    def get_likes_count(obj):
        return obj.likes.count()

    @staticmethod
    def get_replies_count(obj):
        return obj.replies.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    @staticmethod
    def get_location_name(obj):
        if obj.location:
            # This would integrate with a geocoding service
            # For now, return generic location
            return "Nearby"
        return None
