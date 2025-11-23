# backend/federation/views.py
import json
import logging

from accounts.models import User
from asgiref.sync import async_to_sync
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from posts.models import Post

from .handlers import ActivityHandler
from .models import RemoteUser
from .signing import verify_request_signature

logger = logging.getLogger(__name__)


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
        },
        content_type="application/jrd+json",
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
        # Return HTML profile page for browsers
        return HttpResponse(f"{user.display_name or user.username}ActivityPub actor")

    return JsonResponse(
        user.to_activitypub_actor(), content_type="application/activity+json"
    )


@csrf_exempt
@require_http_methods(["POST"])
def inbox_view(request, username=None):
    """Handle incoming ActivityPub activities"""
    try:
        activity = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Verify HTTP signature
    if not _verify_signature(request):
        logger.warning(f"Invalid signature for activity {activity.get('id')}")
        return JsonResponse({"error": "Invalid signature"}, status=401)

    # Process activity
    handler = ActivityHandler()
    result = async_to_sync(handler.handle_activity)(activity, request)

    # ActivityPub spec says to return 202 Accepted for async processing
    return JsonResponse(result, status=202)


@csrf_exempt
@require_http_methods(["POST"])
def shared_inbox_view(request):
    """Handle activities for the entire instance (shared inbox)"""
    return inbox_view(request)


@require_http_methods(["GET"])
def outbox_view(request, username):
    """Return user's outbox (collection of activities)"""
    user = get_object_or_404(User, username=username)

    # Get recent public posts
    posts = Post.objects.filter(author=user, visibility=1).order_by(  # Public only
        "-created_at"
    )[:20]

    # Convert to activities
    items = []
    for post in posts:
        note = post.to_activitypub_note()
        activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Create",
            "id": f"{post.activity_id}/activity",
            "actor": user.actor_uri,
            "published": post.created_at.isoformat(),
            "object": note,
        }
        items.append(activity)

    outbox = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "OrderedCollection",
        "id": f"https://{settings.INSTANCE_DOMAIN}/users/{username}/outbox",
        "totalItems": len(items),
        "orderedItems": items,
    }

    return JsonResponse(outbox, content_type="application/activity+json")


@require_http_methods(["GET"])
def followers_view(request, username):
    """Return user's followers collection"""
    user = get_object_or_404(User, username=username)

    # Get follower URIs
    from accounts.models import Follow

    followers = Follow.objects.filter(following=user, accepted=True).select_related(
        "follower"
    )

    follower_uris = [
        f.follower.actor_uri for f in followers if hasattr(f.follower, "actor_uri")
    ]

    collection = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "OrderedCollection",
        "id": f"https://{settings.INSTANCE_DOMAIN}/users/{username}/followers",
        "totalItems": len(follower_uris),
        "orderedItems": follower_uris,
    }

    return JsonResponse(collection, content_type="application/activity+json")


@require_http_methods(["GET"])
def following_view(request, username):
    """Return user's following collection"""
    user = get_object_or_404(User, username=username)

    from accounts.models import Follow

    following = Follow.objects.filter(follower=user, accepted=True).select_related(
        "following"
    )

    following_uris = [
        f.following.actor_uri for f in following if hasattr(f.following, "actor_uri")
    ]

    collection = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "OrderedCollection",
        "id": f"https://{settings.INSTANCE_DOMAIN}/users/{username}/following",
        "totalItems": len(following_uris),
        "orderedItems": following_uris,
    }

    return JsonResponse(collection, content_type="application/activity+json")


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


def _verify_signature(request) -> bool:
    """Verify HTTP signature on incoming request"""
    if not settings.FEDERATION_ENABLED:
        return True  # Skip verification if federation disabled

    # Build headers dict
    headers = {
        k.lower().replace("http_", "").replace("_", "-"): v
        for k, v in request.META.items()
        if k.startswith("HTTP_")
    }
    headers["(request-target)"] = f"{request.method.lower()} {request.path}"

    def key_lookup(key_id: str) -> bytes:
        """Look up public key for verification"""
        try:
            # Extract actor URI from key_id (format: actor_uri#main-key)
            actor_uri = key_id.split("#")[0]

            # Try to get from database
            remote_user = RemoteUser.objects.filter(
                actor_uri=actor_uri).first()
            if remote_user and remote_user.public_key:
                return remote_user.public_key.encode("utf-8")

            # Fetch from remote if not cached
            from .services import ActivityPubService

            ap_service = ActivityPubService()
            actor_data = async_to_sync(ap_service.fetch_actor)(actor_uri)
            if actor_data:
                public_key = actor_data.get(
                    "publicKey", {}).get("publicKeyPem", "")
                if public_key:
                    return public_key.encode("utf-8")

        except Exception as e:
            logger.error(f"Error looking up key {key_id}: {e}")

        return None

    # Verify signature
    valid, reason = verify_request_signature(
        headers, request.method, request.path, request.body, key_lookup
    )

    if not valid:
        logger.warning(f"Signature verification failed: {reason}")

    return valid
