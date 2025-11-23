# backend/posts/serializers.py
from accounts.serializers import UserSerializer
from django.contrib.gis.geos import Point
from .models import Post, Comment
from privacy.services import PrivacyService
from rest_framework import serializers


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""

    location = serializers.JSONField(required=False, allow_null=True)
    nearby_radius_meters = serializers.IntegerField(required=False, allow_null=True)
    visibility = serializers.CharField()  # Accept string, convert in validate_visibility

    class Meta:
        model = Post
        fields = ["content", "content_warning", "visibility", "local_only", "location", "nearby_radius_meters"]

    def validate_content(self, value):
        """Validate and sanitize post content"""
        from services.validation_service import InputValidationService
        return InputValidationService.validate_post_content(value)
    
    def validate_visibility(self, value):
        """Convert string visibility to integer"""
        visibility_map = {
            'public': 1,
            'local': 2,
            'followers': 3,
            'private': 4,
        }
        if isinstance(value, str):
            return visibility_map.get(value.lower(), 1)
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user

        nearby_radius = validated_data.pop("nearby_radius_meters", None)
        validated_data.pop("location", None)  # Remove unused location field
        location_point = None

        # If nearby radius is set, use user's stored location (already fuzzed)
        if nearby_radius and user.approximate_location:
            location_point = user.approximate_location

        post = Post.objects.create(
            author=user, 
            location=location_point,
            location_radius=nearby_radius,
            **validated_data
        )

        return post


class PostSerializer(serializers.ModelSerializer):
    """Serializer for displaying posts"""

    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    location_name = serializers.SerializerMethodField()
    location_radius = serializers.IntegerField(read_only=True)

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
            "location_radius",
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



class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer"""
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "content", "created_at"]
        read_only_fields = ["id", "post", "author", "created_at"]
