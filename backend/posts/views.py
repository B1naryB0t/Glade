from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.db.models import Q
from federation.tasks import federate_post
from privacy.services import PrivacyService
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from models import Like, Post
from serializers import PostCreateSerializer, PostSerializer


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

    def perform_create(self, serializer):
        post = serializer.save()

        # Trigger federation if not local-only
        if not post.local_only:
            federate_post.delay(str(post.id))


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
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if created:
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
