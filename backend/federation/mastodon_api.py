# backend/federation/mastodon_api.py
"""
Mastodon-compatible API endpoints.
Wraps existing Glade functionality to provide Mastodon API compatibility.
"""
import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from posts.models import Post, Like
from accounts.models import User, Follow


@require_http_methods(["GET"])
def timeline_home(request):
    """Home timeline - posts from followed users"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # Get posts from followed users
    following_ids = request.user.following.values_list('id', flat=True)
    posts = Post.objects.filter(author_id__in=following_ids).order_by('-created_at')[:20]
    
    return JsonResponse([_post_to_status(post) for post in posts], safe=False)


@require_http_methods(["GET"])
def timeline_public(request):
    """Public timeline - all public posts"""
    posts = Post.objects.filter(visibility=1).order_by('-created_at')[:20]  # 1 = Public
    return JsonResponse([_post_to_status(post) for post in posts], safe=False)


@require_http_methods(["GET"])
def timeline_local(request):
    """Local timeline - public posts from this instance"""
    posts = Post.objects.filter(
        visibility=1,
        local_only=True
    ).order_by('-created_at')[:20]
    return JsonResponse([_post_to_status(post) for post in posts], safe=False)


def _post_to_status(post):
    """Convert Glade Post to Mastodon Status format"""
    return {
        "id": str(post.id),
        "created_at": post.created_at.isoformat(),
        "content": post.content,
        "visibility": _visibility_to_mastodon(post.visibility),
        "sensitive": False,
        "spoiler_text": "",
        "media_attachments": [],
        "mentions": [],
        "tags": [],
        "emojis": [],
        "reblogs_count": 0,
        "favourites_count": post.likes.count(),
        "replies_count": post.comments.count(),
        "url": f"https://{settings.INSTANCE_DOMAIN}/posts/{post.id}",
        "account": _user_to_account(post.author),
        "reblog": None,
    }


def _user_to_account(user):
    """Convert Glade User to Mastodon Account format"""
    return {
        "id": str(user.id),
        "username": user.username,
        "acct": user.username,
        "display_name": user.display_name or user.username,
        "locked": False,
        "bot": False,
        "created_at": user.created_at.isoformat(),
        "note": user.bio or "",
        "url": f"https://{settings.INSTANCE_DOMAIN}/users/{user.username}",
        "avatar": user.avatar_url,
        "header": "",
        "followers_count": user.followers.count(),
        "following_count": user.following.count(),
        "statuses_count": user.posts.count(),
    }


def _visibility_to_mastodon(visibility):
    """Convert Glade visibility to Mastodon format"""
    mapping = {
        1: "public",      # Public
        2: "unlisted",    # Local
        3: "private",     # Followers
        4: "direct",      # Private/Direct
    }
    return mapping.get(visibility, "public")



@csrf_exempt
@require_http_methods(["POST"])
def create_status(request):
    """Create a new status (post)"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    content = data.get("status", "")
    visibility = data.get("visibility", "public")
    
    if not content:
        return JsonResponse({"error": "Status content required"}, status=400)
    
    # Convert Mastodon visibility to Glade visibility
    visibility_map = {
        "public": 1,
        "unlisted": 2,
        "private": 3,
        "direct": 4,
    }
    
    post = Post.objects.create(
        author=request.user,
        content=content,
        visibility=visibility_map.get(visibility, 1),
        local_only=False
    )
    
    return JsonResponse(_post_to_status(post), status=201)





@csrf_exempt
@require_http_methods(["GET", "DELETE"])
def status_detail(request, status_id):
    """Get or delete a status"""
    if request.method == "DELETE":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)
        
        try:
            post = Post.objects.get(id=status_id, author=request.user)
            post.delete()
            return JsonResponse({}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Record not found"}, status=404)
    
    # GET
    try:
        post = Post.objects.get(id=status_id)
        return JsonResponse(_post_to_status(post))
    except Post.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def favourite_status(request, status_id):
    """Favourite (like) a status"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        post = Post.objects.get(id=status_id)
        Like.objects.get_or_create(user=request.user, post=post)
        return JsonResponse(_post_to_status(post))
    except Post.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def unfavourite_status(request, status_id):
    """Unfavourite (unlike) a status"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        post = Post.objects.get(id=status_id)
        Like.objects.filter(user=request.user, post=post).delete()
        return JsonResponse(_post_to_status(post))
    except Post.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)



@require_http_methods(["GET"])
def get_account(request, account_id):
    """Get account by ID"""
    try:
        user = User.objects.get(id=account_id)
        return JsonResponse(_user_to_account(user))
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@require_http_methods(["GET"])
def verify_credentials(request):
    """Verify credentials and return current user account"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    return JsonResponse(_user_to_account(request.user))


@require_http_methods(["GET"])
def account_statuses(request, account_id):
    """Get statuses for an account"""
    try:
        user = User.objects.get(id=account_id)
        posts = Post.objects.filter(author=user).order_by('-created_at')[:20]
        return JsonResponse([_post_to_status(post) for post in posts], safe=False)
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def follow_account(request, account_id):
    """Follow an account"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        user_to_follow = User.objects.get(id=account_id)
        Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        return JsonResponse(_user_to_account(user_to_follow))
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def unfollow_account(request, account_id):
    """Unfollow an account"""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        user_to_unfollow = User.objects.get(id=account_id)
        Follow.objects.filter(
            follower=request.user,
            following=user_to_unfollow
        ).delete()
        return JsonResponse(_user_to_account(user_to_unfollow))
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@require_http_methods(["GET"])
def account_followers(request, account_id):
    """Get followers for an account"""
    try:
        user = User.objects.get(id=account_id)
        followers = user.followers.all()[:40]
        return JsonResponse([_user_to_account(f.follower) for f in followers], safe=False)
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)


@require_http_methods(["GET"])
def account_following(request, account_id):
    """Get accounts that this account is following"""
    try:
        user = User.objects.get(id=account_id)
        following = user.following.all()[:40]
        return JsonResponse([_user_to_account(f.following) for f in following], safe=False)
    except User.DoesNotExist:
        return JsonResponse({"error": "Record not found"}, status=404)
