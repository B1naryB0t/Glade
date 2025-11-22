# backend/posts/views.py
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from accounts.models import User
from federation.tasks import federate_post
from .models import Comment, Like, Post
from notifications.services import NotificationService
from privacy.services import PrivacyService
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import CommentSerializer, PostCreateSerializer, PostSerializer
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
        
        # Simplified: Show all public posts and posts from users you follow
        # TODO: Add back location-based filtering later
        queryset = Post.objects.select_related("author").prefetch_related("likes", "comments")
        
        # Show public posts (visibility=1) or posts from followed users
        return queryset.filter(
            visibility=1  # Public posts only for now
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Check rate limit
        if not RateLimitService.check_rate_limit(
            request.user, "create_post", limit=10, window=300
        ):
            return Response(
                {"error": "Rate limit exceeded. Please wait before posting again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Trigger federation if not local-only (catch errors if Celery/Redis unavailable)
        if not post.local_only:
            try:
                federate_post.delay(str(post.id))
            except Exception as e:
                # Log but don't fail post creation if federation fails
                print(f"Federation task failed: {e}")

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



@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def post_comments(request, post_id):
    """Get or create comments on a post"""
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    if request.method == "GET":
        comments = Comment.objects.filter(post=post).select_related("author")
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(author=request.user, post=post)
            # Re-serialize to include the author data
            response_serializer = CommentSerializer(comment)
            return Response(response_serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_post(request, post_id):
    """Delete a post (only by author)"""
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    # Only author can delete their post
    if post.author != request.user:
        return Response({"error": "You can only delete your own posts"}, status=403)

    post.delete()
    return Response({"message": "Post deleted successfully"}, status=200)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, comment_id):
    """Delete a comment (only by author)"""
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=404)

    # Only author can delete their comment
    if comment.author != request.user:
        return Response({"error": "You can only delete your own comments"}, status=403)

    comment.delete()
    return Response({"message": "Comment deleted successfully"}, status=200)



class UserPostsView(generics.ListAPIView):
    """Get posts by a specific user"""
    
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        
        # Get posts by this user
        return Post.objects.filter(
            author=user,
            visibility=1  # Only public posts for now
        ).select_related('author').prefetch_related('likes').order_by('-created_at')
