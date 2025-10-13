# backend/federation/tasks.py
from accounts.models import Follow, User
from asgiref.sync import async_to_sync
from celery import shared_task
from django.conf import settings
from posts.models import Post
from services import ActivityPubService


@shared_task
def federate_post(post_id: str, activity_type: str = "Create"):
    """Federate a post to relevant instances"""
    try:
        post = Post.objects.get(id=post_id)

        # Don't federate local-only posts
        if post.local_only or not settings.FEDERATION_ENABLED:
            return

        # Get author
        author = post.author
        if not author.federation_enabled:
            return

        # Create ActivityPub activity
        activitypub = ActivityPubService()
        note = post.to_activitypub_note()
        activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": activity_type,
            "id": f"https://{settings.INSTANCE_DOMAIN}/activities/{post.id}",
            "actor": author.actor_uri,
            "published": post.created_at.isoformat(),
            "object": note,
        }

        # Get target inboxes
        target_inboxes = get_federation_targets(author, post)

        # Send to all targets
        success_count = 0
        for inbox_url in target_inboxes:
            try:
                success = async_to_sync(activitypub.send_activity)(
                    author, activity, inbox_url
                )
                if success:
                    success_count += 1
            except Exception as e:
                print(f"Failed to federate to {inbox_url}: {e}")

        print(
            f"Federated post {post.id} to {success_count}/{len(target_inboxes)} inboxes"
        )

    except Post.DoesNotExist:
        print(f"Post {post_id} not found")
    except Exception as e:
        print(f"Federation error: {e}")


def get_federation_targets(author: User, post: Post) -> list:
    """Get list of inbox URLs to federate to"""
    inboxes = []

    # 1. Author's followers
    follower_inboxes = (
        Follow.objects.filter(following=author, accepted=True)
        .exclude(follower__actor_uri__startswith=f"https://{settings.INSTANCE_DOMAIN}")
        .values_list("follower__inbox_url", flat=True)
    )
    inboxes.extend(follower_inboxes)

    # 2. For local/public posts, add nearby Glade instances
    if post.location and post.visibility in [1, 2]:  # Public or Local
        nearby_inboxes = get_nearby_instance_inboxes(post)
        inboxes.extend(nearby_inboxes)

    # Remove duplicates and return
    return list(set(inboxes))


def get_nearby_instance_inboxes(post: Post) -> list:
    """Get inboxes of Glade instances with users near the post location"""
    # This would implement geospatial queries to find nearby instances
    # For now, return empty list
    return []
