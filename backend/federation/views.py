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

    # Use current INSTANCE_DOMAIN instead of saved actor_uri
    actor_uri = f"https://{settings.INSTANCE_DOMAIN}/users/{username}"

    return JsonResponse(
        {
            "subject": resource,
            "links": [
                {
                    "rel": "self",
                    "type": "application/activity+json",
                    "href": actor_uri,
                }
            ],
        },
        content_type="application/jrd+json",
    )


@require_http_methods(["GET", "HEAD"])
def actor_view(request, username):
    """Return ActivityPub Actor object"""
    user = get_object_or_404(User, username=username)

    # Check Accept header for ActivityPub content type
    accept = request.META.get("HTTP_ACCEPT", "")
    if (
        "application/activity+json" not in accept
        and "application/ld+json" not in accept
    ):
        # Return HTML profile page for browsers with proper ActivityPub link
        actor_url = f"https://{settings.INSTANCE_DOMAIN}/users/{username}"
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{user.display_name or user.username} - Glade</title>
    <link rel="alternate" type="application/activity+json" href="{actor_url}">
</head>
<body>
    <h1>{user.display_name or user.username}</h1>
    <p>@{user.username}@{settings.INSTANCE_DOMAIN}</p>
    <p>{user.bio or 'ActivityPub actor'}</p>
</body>
</html>"""
        return HttpResponse(html)

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


def _fetch_actor_sync(actor_uri: str) -> dict:
    """Fetch actor synchronously with automatic signed request retry"""
    import httpx
    from datetime import datetime, timezone
    from urllib.parse import urlparse
    from .signing import sign_request
    
    # Check cache first
    from django.core.cache import cache
    cached = cache.get(f"actor:{actor_uri}")
    if cached:
        return cached
    
    try:
        with httpx.Client(timeout=30.0) as client:
            headers = {
                "Accept": "application/activity+json, application/ld+json",
                "User-Agent": f"Glade/{settings.INSTANCE_DOMAIN}",
            }
            
            # Try unsigned first
            response = client.get(actor_uri, headers=headers, follow_redirects=True)
            
            # If 401/403, retry with signature
            if response.status_code in [401, 403]:
                logger.info(f"Actor fetch requires signed request: {actor_uri}")
                local_user = User.objects.filter(is_active=True).first()
                if local_user:
                    parsed_url = urlparse(actor_uri)
                    now = datetime.now(timezone.utc)
                    date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")
                    
                    private_key_pem = local_user.private_key.encode("utf-8")
                    key_id = f"{local_user.actor_uri}#main-key"
                    
                    sig_headers = sign_request(
                        private_key_pem=private_key_pem,
                        key_id=key_id,
                        method="GET",
                        path=parsed_url.path or "/",
                        host=parsed_url.netloc,
                        body=b"",
                        date=date,
                    )
                    headers.update(sig_headers)
                    headers["Host"] = parsed_url.netloc
                    
                    response = client.get(actor_uri, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                actor_data = response.json()
                
                # Cache for 1 hour
                cache.set(f"actor:{actor_uri}", actor_data, 3600)
                
                # Store in database
                from .models import RemoteInstance, RemoteUser
                domain = urlparse(actor_uri).netloc
                instance, _ = RemoteInstance.objects.get_or_create(domain=domain)
                
                # Extract username from actor_uri if preferredUsername is missing
                username = actor_data.get("preferredUsername", "")
                if not username:
                    # Try to extract from actor_uri (e.g., /users/frank or /frank)
                    username = actor_uri.rstrip('/').split('/')[-1]
                
                RemoteUser.objects.update_or_create(
                    actor_uri=actor_uri,
                    defaults={
                        "instance": instance,
                        "username": username,
                        "display_name": actor_data.get("name", ""),
                        "summary": actor_data.get("summary", ""),
                        "avatar_url": actor_data.get("icon", {}).get("url", ""),
                        "inbox_url": actor_data.get("inbox", ""),
                        "outbox_url": actor_data.get("outbox", ""),
                        "public_key": actor_data.get("publicKey", {}).get("publicKeyPem", ""),
                    },
                )
                
                return actor_data
            else:
                logger.warning(f"Failed to fetch actor {actor_uri}: HTTP {response.status_code}")
                
    except Exception as e:
        logger.error(f"Exception fetching actor {actor_uri}: {e}", exc_info=True)
    
    return {}


def _verify_signature(request) -> bool:
    """Verify HTTP signature on incoming request"""
    if not settings.FEDERATION_ENABLED:
        return True  # Skip verification if federation disabled

    # Build headers dict - preserve original case for certain headers
    headers = {}
    for k, v in request.META.items():
        if k.startswith("HTTP_"):
            # Convert HTTP_HEADER_NAME to header-name
            header_name = k[5:].lower().replace("_", "-")
            headers[header_name] = v
    
    # Add special headers that Django stores differently
    headers["(request-target)"] = f"{request.method.lower()} {request.path}"
    
    # Content-Type is stored as CONTENT_TYPE, not HTTP_CONTENT_TYPE
    if "CONTENT_TYPE" in request.META:
        headers["content-type"] = request.META["CONTENT_TYPE"]
    
    def key_lookup(key_id: str) -> bytes:
        """Look up public key for verification"""
        try:
            # Extract actor URI from key_id (format: actor_uri#main-key)
            actor_uri = key_id.split("#")[0]

            # Try to get from database
            remote_user = RemoteUser.objects.filter(actor_uri=actor_uri).first()
            if remote_user and remote_user.public_key:
                return remote_user.public_key.encode("utf-8")

            # Fetch from remote if not cached
            actor_data = _fetch_actor_sync(actor_uri)
            
            if actor_data:
                public_key = actor_data.get("publicKey", {}).get("publicKeyPem", "")
                if public_key:
                    return public_key.encode("utf-8")
                else:
                    logger.warning(f"No publicKey in actor data for {actor_uri}")
            else:
                logger.warning(f"Failed to fetch actor data for {actor_uri}")

        except Exception as e:
            logger.error(f"Error looking up key {key_id}: {e}", exc_info=True)

        return None

    # Verify signature
    valid, reason = verify_request_signature(
        headers, request.method, request.path, request.body, key_lookup
    )

    if not valid:
        logger.warning(f"Signature verification failed: {reason}")

    return valid



def instance_info(request):
    """Mastodon-compatible instance info endpoint (v1 and v2)"""
    return JsonResponse({
        "uri": settings.INSTANCE_DOMAIN,
        "title": settings.INSTANCE_NAME,
        "short_description": settings.INSTANCE_DESCRIPTION,
        "description": settings.INSTANCE_DESCRIPTION,
        "version": "4.2.0",
        "registrations": True,
        "approval_required": False,
        "invites_enabled": False,
        "stats": {
            "user_count": User.objects.count(),
            "status_count": Post.objects.count(),
            "domain_count": 1
        },
        "thumbnail": None,
        "languages": ["en"],
        "contact_account": None
    })


from rest_framework.authtoken.models import Token as AuthToken

@require_http_methods(["GET"])
def federated_timeline(request):
    """Get posts from remote users we follow"""
    from .models import RemotePost, RemoteFollow
    import sys
    
    # Manual token authentication
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    token_key = auth_header.replace('Token ', '')
    try:
        token = AuthToken.objects.select_related('user').get(key=token_key)
        user = token.user
    except AuthToken.DoesNotExist:
        return JsonResponse({"error": "Invalid token"}, status=401)
    
    print(f"[FEDERATED] Authenticated user: {user.username} (ID: {user.id})", file=sys.stderr, flush=True)
    
    try:
        # Get remote users we follow
        following = RemoteFollow.objects.filter(
            follower=user,
            accepted=True
        ).values_list('remote_user_id', flat=True)
        
        following_list = list(following)
        print(f"[FEDERATED] Following count: {len(following_list)}", file=sys.stderr, flush=True)
        
        # Get their posts
        posts = RemotePost.objects.filter(
            remote_user_id__in=following
        ).select_related('remote_user').order_by('-published')[:50]
        
        # Serialize manually
        results = []
        for post in posts:
            results.append({
                'id': str(post.id),
                'activity_id': post.activity_id,
                'content': post.content,
                'published': post.published.isoformat(),
                'summary': post.summary,
                'author': {
                    'id': str(post.remote_user.id),
                    'username': post.remote_user.username,
                    'display_name': post.remote_user.display_name,
                    'avatar_url': post.remote_user.avatar_url,
                    'actor_uri': post.remote_user.actor_uri,
                }
            })
        
        return JsonResponse({"results": results})
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in federated_timeline: {e}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


def fetch_remote_actor_proxy(request):
    """Proxy requests to fetch remote actor data with signed request"""
    import httpx
    import asyncio
    from asgiref.sync import sync_to_async
    from .services import ActivityPubService
    from accounts.models import User
    
    actor_url = request.GET.get('actor_url', '')
    if not actor_url:
        return JsonResponse({'error': 'actor_url parameter required'}, status=400)
    
    async def fetch_with_signature():
        # Use ActivityPubService which handles signing
        service = ActivityPubService()
        
        # Try to get a user to sign with (use first available user)
        try:
            signing_user = await sync_to_async(
                User.objects.filter(private_key__isnull=False).first
            )()
            
            if signing_user:
                actor_data = await service.fetch_actor(actor_url, signed_by=signing_user)
            else:
                actor_data = await service.fetch_actor(actor_url)
            
            return actor_data
        except Exception as e:
            raise e
    
    try:
        actor_data = asyncio.run(fetch_with_signature())
        if actor_data:
            return JsonResponse(actor_data)
        else:
            return JsonResponse({'error': 'Failed to fetch actor'}, status=404)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching actor {actor_url}: {e}")
        return JsonResponse({'error': str(e)}, status=500)


def lookup_remote_user(request):
    """Lookup remote user via WebFinger"""
    import httpx
    
    handle = request.GET.get("handle", "").strip()
    if not handle:
        return JsonResponse({"error": "Handle required"}, status=400)
    
    # Remove @ prefix if present
    handle = handle.lstrip("@")
    
    # Validate format: user@domain
    if "@" not in handle:
        return JsonResponse({"error": "Invalid handle format. Use @user@domain"}, status=400)
    
    username, domain = handle.split("@", 1)
    
    try:
        # Query webfinger (works for both local and remote)
        webfinger_url = f"https://{domain}/.well-known/webfinger"
        params = {"resource": f"acct:{handle}"}
        
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            response = client.get(webfinger_url, params=params)
            
            if response.status_code == 200:
                try:
                    return JsonResponse(response.json())
                except Exception as json_error:
                    logger.error(f"Invalid JSON from {domain}: {json_error}")
                    return JsonResponse(
                        {"error": f"Invalid response from {domain}"}, 
                        status=502
                    )
            else:
                logger.warning(f"WebFinger lookup failed for {handle}: HTTP {response.status_code}")
                return JsonResponse(
                    {"error": f"User not found on {domain} (HTTP {response.status_code})"}, 
                    status=404
                )
                
    except httpx.TimeoutException:
        logger.error(f"Timeout looking up remote user {handle}")
        return JsonResponse(
            {"error": f"Timeout connecting to {domain}"}, 
            status=504
        )
    except Exception as e:
        logger.error(f"Error looking up remote user {handle}: {e}")
        return JsonResponse(
            {"error": f"Failed to lookup user: {str(e)}"}, 
            status=500
        )
