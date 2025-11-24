# backend/federation/instance_views.py
"""
API views for instance management and federation status.
"""
from accounts.models import User
from django.conf import settings
from django.db.models import Count, Q
from posts.models import Post
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Activity, RemoteInstance, RemoteUser


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def instance_info(request):
    """
    Get information about this instance.
    Public endpoint - no auth required.
    """
    # Count local users and posts
    local_users = User.objects.count()
    local_posts = Post.objects.filter(
        federated_id__isnull=True  # Only local posts
    ).count()

    # Count federated content
    remote_users = RemoteUser.objects.count()
    remote_instances = RemoteInstance.objects.filter(
        trust_level__gte=1  # Not blocked
    ).count()
    federated_posts = Post.objects.filter(
        federated_id__isnull=False  # Only federated posts
    ).count()

    # Recent activity
    recent_activities = Activity.objects.filter(processed=True).count()

    return Response(
        {
            "instance": {
                "domain": settings.INSTANCE_DOMAIN,
                "name": settings.INSTANCE_NAME,
                "description": settings.INSTANCE_DESCRIPTION,
                "federation_enabled": settings.FEDERATION_ENABLED,
            },
            "statistics": {
                "local_users": local_users,
                "local_posts": local_posts,
                "remote_users": remote_users,
                "connected_instances": remote_instances,
                "federated_posts": federated_posts,
                "total_activities": recent_activities,
            },
            "features": {
                "location_based": True,
                "privacy_focused": True,
                "activitypub_compatible": True,
            },
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def federation_status(request):
    """
    Get detailed federation status for authenticated users.
    Shows their personal federation statistics.
    """
    user = request.user

    # User's federation stats
    following_remote = user.remote_following.filter(accepted=True).count()
    remote_followers = RemoteUser.objects.filter(
        local_followers__follower=user, local_followers__accepted=True
    ).count()

    # Recent activities involving this user
    recent_user_activities = Activity.objects.filter(
        Q(actor_uri=user.actor_uri) | Q(object_uri=user.actor_uri)
    ).order_by("-created_at")[:10]

    activities_data = [
        {
            "type": act.activity_type,
            "direction": act.direction,
            "actor": act.actor_uri,
            "created_at": act.created_at.isoformat(),
            "processed": act.processed,
        }
        for act in recent_user_activities
    ]

    return Response(
        {
            "user": {
                "actor_uri": user.actor_uri,
                "federation_enabled": user.federation_enabled,
            },
            "connections": {
                "following_remote": following_remote,
                "remote_followers": remote_followers,
            },
            "recent_activities": activities_data,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def remote_instances_list(request):
    """
    List all connected remote instances with statistics.
    """
    instances = RemoteInstance.objects.annotate(
        users_count=Count("remoteuser"), activities_count=Count("remoteuser__posts")
    ).order_by("-last_seen_at")

    data = [
        {
            "id": str(inst.id),
            "domain": inst.domain,
            "software": inst.software or "unknown",
            "version": inst.version or "unknown",
            "trust_level": inst.get_trust_level_display(),
            "users_count": inst.users_count,
            "last_seen": inst.last_seen_at.isoformat() if inst.last_seen_at else None,
            "created_at": inst.created_at.isoformat(),
        }
        for inst in instances
    ]

    return Response(
        {
            "instances": data,
            "total": len(data),
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def remote_users_list(request):
    """
    List remote users with pagination.
    """
    page = int(request.query_params.get("page", 1))
    page_size = 20

    remote_users = RemoteUser.objects.select_related(
        "instance").order_by("-created_at")

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    total = remote_users.count()

    users_page = remote_users[start:end]

    data = [
        {
            "id": str(user.id),
            "username": user.username,
            "display_name": user.display_name,
            "actor_uri": user.actor_uri,
            "avatar_url": user.avatar_url,
            "instance": {
                "domain": user.instance.domain,
                "software": user.instance.software,
            },
            "summary": user.summary,
            "created_at": user.created_at.isoformat(),
        }
        for user in users_page
    ]

    return Response(
        {
            "results": data,
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def activity_log(request):
    """
    Get activity log for debugging/monitoring federation.
    """
    page = int(request.query_params.get("page", 1))
    page_size = 50
    activity_type = request.query_params.get("type")
    direction = request.query_params.get("direction")

    activities = Activity.objects.all()

    if activity_type:
        activities = activities.filter(activity_type=activity_type)
    if direction:
        activities = activities.filter(direction=direction)

    activities = activities.order_by("-created_at")

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    total = activities.count()

    activities_page = activities[start:end]

    data = [
        {
            "id": str(act.id),
            "activity_type": act.activity_type,
            "direction": act.direction,
            "actor_uri": act.actor_uri,
            "object_uri": act.object_uri,
            "processed": act.processed,
            "error_message": act.error_message,
            "created_at": act.created_at.isoformat(),
        }
        for act in activities_page
    ]

    return Response(
        {
            "results": data,
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size,
        }
    )
