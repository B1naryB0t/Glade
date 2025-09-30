# backend/posts/views.py
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from federation.tasks import federate_post
from models import Like, Post
from notifications.services import NotificationService
from privacy.services import PrivacyService
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from serializers import PostCreateSerializer, PostSerializer
from services.validation_service import InputValidationService, RateLimitService


class PostListCreateView(generics.ListCreateAPIView):
    """List and create posts"""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        user = self.request.user
        privacy_service = PrivacyService()

        # Get posts user can see based on privacy rules
        queryset = Post.objects.select_related("author").prefetch_related("likes")
        visible_posts = []

        for post in queryset:
            if privacy_service.can_user_see_post(user, post):
                visible_posts.append(post.id)

        return queryset.filter(id__in=visible_posts).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Check rate limit
        if not RateLimitService.check_rate_limit(
            request.user, "create_post", limit=10, window=300
        ):
            return Response(
                {"error": "Rate limit exceeded. Please wait before posting again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Validate content
        try:
            content = request.data.get("content", "")
            validated_content = InputValidationService.validate_post_content(content)

            # Update request data with validated content
            request.data._mutable = True
            request.data["content"] = validated_content
            request.data._mutable = False

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Trigger federation if not local-only
        if not post.local_only:
            federate_post.delay(str(post.id))

        return Response(
            PostSerializer(post, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class LocalPostsView(generics.ListAPIView):
    """Get posts near user's location"""

    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        lat = float(self.request.query_params.get("lat", 0))
        lng = float(self.request.query_params.get("lng", 0))
        radius = int(self.request.query_params.get("radius", 1000))

        user_location = Point(lng, lat)

        # Find posts within radius
        nearby_posts = (
            Post.objects.filter(
                location__distance_lte=(user_location, radius),
                visibility__in=[1, 2],  # Public or Local
            )
            .annotate(distance=Distance("location", user_location))
            .order_by("distance", "-created_at")
        )

        return nearby_posts


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def like_post(request, post_id):
    """Like or unlike a post"""
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    # Check if user can see this post
    privacy_service = PrivacyService()
    if not privacy_service.can_user_see_post(request.user, post):
        return Response({"error": "Post not found"}, status=404)

    if request.method == "POST":
        # Check rate limit
        if not RateLimitService.check_rate_limit(
            request.user, "like_post", limit=30, window=60
        ):
            return Response(
                {"error": "Rate limit exceeded. Please slow down."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if created:
            # Create notification for post author
            NotificationService.notify_post_like(post, request.user)

            # TODO: Federate like activity
            return Response({"liked": True}, status=201)
        return Response({"liked": True}, status=200)

    else:  # DELETE
        try:
            like = Like.objects.get(user=request.user, post=post)
            like.delete()
            # TODO: Federate undo like activity
            return Response({"liked": False}, status=200)
        except Like.DoesNotExist:
            return Response({"liked": False}, status=200)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def upload_post_image(request):
    """Upload an image for a post"""
    if "image" not in request.FILES:
        return Response(
            {"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    image_file = request.FILES["image"]

    try:
        # Validate image file
        InputValidationService.validate_image_file(image_file, is_avatar=False)

        # Save image (you would implement actual storage here)
        # For now, return success
        return Response(
            {
                "success": True,
                "message": "Image uploaded successfully",
                "url": "/media/placeholder.jpg",  # Replace with actual URL
            },
            status=status.HTTP_201_CREATED,
        )

    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
