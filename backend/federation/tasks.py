# backend/federation/tasks.py
"""
Celery tasks for ActivityPub delivery
"""
import json
import logging

import httpx
from accounts.models import Follow, User
from asgiref.sync import async_to_sync
from celery import shared_task
from django.conf import settings
from posts.models import Post

from .models import Activity, RemoteUser
from .services import ActivityPubService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=5, autoretry_for=(Exception,), retry_backoff=True)
def deliver_activity(self, activity_dict: dict, inboxes: list):
    """
    Deliver an activity to multiple remote inboxes.
    Uses ActivityPubService for signing and delivery.
    """
    try:
        actor_uri = activity_dict.get("actor")
        activity_id = activity_dict.get("id")

        # Find local user for signing
        try:
            # Extract username from actor URI
            username = actor_uri.rstrip("/").split("/")[-1]
            local_user = User.objects.get(username=username)
        except User.DoesNotExist:
            logger.error(f"Local user not found for actor {actor_uri}")
            return

        # Use ActivityPubService to send
        ap_service = ActivityPubService()
        success_count = 0
        failed_inboxes = []

        for inbox in inboxes:
            try:
                success = async_to_sync(ap_service.send_activity)(
                    local_user, activity_dict, inbox
                )
                if success:
                    success_count += 1
                else:
                    failed_inboxes.append(inbox)
            except Exception as e:
                logger.error(f"Failed to deliver to {inbox}: {e}")
                failed_inboxes.append(inbox)

        logger.info(
            f"Delivered activity {activity_id} to {success_count}/{len(inboxes)} inboxes"
        )

        # Retry failed inboxes
        if failed_inboxes and self.request.retries < self.max_retries:
            raise Exception(
                f"Failed to deliver to {len(failed_inboxes)} inboxes")

    except Exception as exc:
        logger.exception("deliver_activity error")
        raise self.retry(exc=exc)


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

        if target_inboxes:
            # Queue delivery task
            deliver_activity.delay(activity, target_inboxes)

        logger.info(
            f"Queued post {post.id} for federation to {len(target_inboxes)} inboxes"
        )

    except Post.DoesNotExist:
        logger.error(f"Post {post_id} not found")
    except Exception as e:
        logger.exception(f"Federation error: {e}")


@shared_task
def federate_follow(follow_id: str):
    """Send Follow activity to remote user"""
    try:
        follow = Follow.objects.get(id=follow_id)

        # Only federate if following a remote user
        if not hasattr(follow.following, "actor_uri"):
            return

        if follow.following.actor_uri.startswith(f"https://{settings.INSTANCE_DOMAIN}"):
            return

        # Create Follow activity
        activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Follow",
            "id": f"https://{settings.INSTANCE_DOMAIN}/activities/follow/{follow.id}",
            "actor": follow.follower.actor_uri,
            "object": follow.following.actor_uri,
        }

        # Get target inbox
        remote_user = RemoteUser.objects.filter(
            actor_uri=follow.following.actor_uri
        ).first()

        if remote_user and remote_user.inbox_url:
            deliver_activity.delay(activity, [remote_user.inbox_url])
            logger.info(f"Queued follow {follow.id} for federation")

    except Follow.DoesNotExist:
        logger.error(f"Follow {follow_id} not found")
    except Exception as e:
        logger.exception(f"Follow federation error: {e}")


@shared_task
def federate_like(like_id: str):
    """Send Like activity to remote server"""
    from posts.models import Like

    try:
        like = Like.objects.get(id=like_id)
        post = like.post

        # Only federate likes on federated posts
        if not post.federated_id:
            return

        activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Like",
            "id": f"https://{settings.INSTANCE_DOMAIN}/activities/like/{like.id}",
            "actor": like.user.actor_uri,
            "object": post.activity_id,
        }

        # Send to post author's inbox
        if post.author.actor_uri and not post.author.actor_uri.startswith(
            f"https://{settings.INSTANCE_DOMAIN}"
        ):
            remote_user = RemoteUser.objects.filter(
                actor_uri=post.author.actor_uri
            ).first()
            if remote_user and remote_user.inbox_url:
                deliver_activity.delay(activity, [remote_user.inbox_url])

    except Like.DoesNotExist:
        logger.error(f"Like {like_id} not found")


@shared_task
def federate_delete(
    activity_id: str, object_uri: str, actor_uri: str, target_inboxes: list
):
    """Send Delete activity"""
    activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Delete",
        "id": activity_id,
        "actor": actor_uri,
        "object": object_uri,
    }

    if target_inboxes:
        deliver_activity.delay(activity, target_inboxes)


def get_federation_targets(author: User, post: Post) -> list:
    """Get list of inbox URLs to federate to"""
    inboxes = set()

    # 1. Author's followers
    follower_inboxes = (
        Follow.objects.filter(following=author, accepted=True)
        .exclude(follower__actor_uri__startswith=f"https://{settings.INSTANCE_DOMAIN}")
        .values_list("follower__inbox_url", flat=True)
    )
    inboxes.update(follower_inboxes)

    # 2. If replying to a federated post, include original author
    if post.reply_to and post.reply_to.federated_id:
        remote_author = RemoteUser.objects.filter(
            actor_uri=post.reply_to.author.actor_uri
        ).first()
        if remote_author and remote_author.inbox_url:
            inboxes.add(remote_author.inbox_url)

    # 3. For location-based posts, could add nearby instances
    # TODO: Implement geospatial federation discovery

    return list(inboxes)
