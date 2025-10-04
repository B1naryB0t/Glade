# backend/federation/views.py
import json

from accounts.models import User
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from posts.models import Post

# from .handlers import ActivityHandler # this does not exist


def webfinger(request):
    """WebFinger endpoint for user discovery"""
    resource = request.GET.get("resource", "")

    if not resource.startswith("acct:"):
        return JsonResponse({"error": "Invalid resource"}, status=400)

    # Parse acct:username@domain
    account = resource[5:]  # Remove 'acct:'
    if "@" not in account:
        return JsonResponse({"error": "Invalid account format"}, status=400)

    username, domain = account.split("@", 1)

    if domain != settings.INSTANCE_DOMAIN:
        return JsonResponse({"error": "User not found"}, status=404)

    user = get_object_or_404(User, username=username)

    return JsonResponse(
        {
            "subject": resource,
            "links": [
                {
                    "rel": "self",
                    "type": "application/activity+json",
                    "href": user.actor_uri,
                }
            ],
        }
    )


@require_http_methods(["GET"])
def actor_view(request, username):
    """Return ActivityPub Actor object"""
    user = get_object_or_404(User, username=username)

    # Check Accept header for ActivityPub content type
    accept = request.META.get("HTTP_ACCEPT", "")
    if (
        "application/activity+json" not in accept
        and "application/ld+json" not in accept
    ):
        # Redirect to user profile page for browsers
        return redirect("user_profile", username=username)

    return JsonResponse(
        user.to_activitypub_actor(), content_type="application/activity+json"
    )


@csrf_exempt
@require_http_methods(["POST"])
async def inbox_view(request, username=None):
    """Handle incoming ActivityPub activities"""
    try:
        activity = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    handler = ActivityHandler()
    return await handler.handle_activity(activity, request)


@csrf_exempt
@require_http_methods(["POST"])
async def shared_inbox_view(request):
    """Handle activities for the entire instance"""
    return await inbox_view(request)


@require_http_methods(["GET"])
def post_view(request, post_id):
    """Return ActivityPub Note object for a post"""
    post = get_object_or_404(Post, id=post_id)

    # Check if requester can view this post
    if post.visibility == 4:  # Private
        return HttpResponse(status=403)

    return JsonResponse(
        post.to_activitypub_note(), content_type="application/activity+json"
    )


def nodeinfo_discovery(request):
    """NodeInfo discovery endpoint"""
    return JsonResponse(
        {
            "links": [
                {
                    "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
                    "href": f"https://{settings.INSTANCE_DOMAIN}/nodeinfo/2.0",
                }
            ]
        }
    )


def nodeinfo(request):
    """NodeInfo endpoint for instance metadata"""
    from accounts.models import User
    from posts.models import Post

    user_count = User.objects.count()
    post_count = Post.objects.count()

    return JsonResponse(
        {
            "version": "2.0",
            "software": {"name": "glade", "version": "0.1.0"},
            "protocols": ["activitypub"],
            "services": {"inbound": [], "outbound": []},
            "openRegistrations": True,
            "usage": {
                "users": {
                    "total": user_count,
                    "activeMonth": user_count,
                    "activeHalfyear": user_count,
                },
                "localPosts": post_count,
            },
            "metadata": {
                "nodeName": settings.INSTANCE_NAME,
                "nodeDescription": settings.INSTANCE_DESCRIPTION,
                "privacyFocused": True,
                "locationAware": True,
                "federation": {
                    "enabled": settings.FEDERATION_ENABLED,
                    "locationBased": True,
                    "privacyRespecting": True,
                },
            },
        }
    )
