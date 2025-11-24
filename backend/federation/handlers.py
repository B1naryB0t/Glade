# backend/federation/handlers.py
"""
ActivityPub activity handlers for inbox processing.
"""

import logging
from typing import Optional

from accounts.models import Follow, User
from asgiref.sync import sync_to_async
from django.conf import settings
from django.core.cache import cache
from posts.models import Like, Post

from .models import Activity, RemoteUser
from .services import ActivityPubService

logger = logging.getLogger(__name__)


class ActivityHandler:
    """Handle incoming ActivityPub activities"""

    def __init__(self):
        self.ap_service = ActivityPubService()

    async def handle_activity(self, activity: dict, request=None) -> dict:
        """
        Main entry point for processing inbox activities.
        Returns dict with status info.
        """
        activity_type = activity.get("type")
        activity_id = activity.get("id", "")
        actor_uri = activity.get("actor", "")

        logger.info(f"Processing {activity_type} activity from {actor_uri}")

        # Log activity
        await self._log_activity(activity, "inbound")

        # Route to handler
        handler_map = {
            "Follow": self._handle_follow,
            "Accept": self._handle_accept,
            "Reject": self._handle_reject,
            "Create": self._handle_create,
            "Update": self._handle_update,
            "Delete": self._handle_delete,
            "Like": self._handle_like,
            "Announce": self._handle_announce,
            "Undo": self._handle_undo,
        }

        handler = handler_map.get(activity_type)
        if not handler:
            logger.warning(f"Unsupported activity type: {activity_type}")
            return {"status": "ignored", "reason": "unsupported type"}

        try:
            result = await handler(activity)
            await self._mark_activity_processed(activity_id)
            return result
        except Exception as e:
            logger.exception(f"Error handling {activity_type}: {e}")
            await self._mark_activity_error(activity_id, str(e))
            return {"status": "error", "reason": str(e)}

    async def _handle_follow(self, activity: dict) -> dict:
        """Handle Follow activity from remote user"""
        actor_uri = activity.get("actor")
        object_uri = activity.get("object")

        # Get or create remote user
        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        if not remote_user:
            return {"status": "error", "reason": "could not fetch remote actor"}

        # Find local user being followed
        local_user = await self._get_local_user_from_uri(object_uri)
        if not local_user:
            return {"status": "error", "reason": "local user not found"}

        # Track the remote follower
        from .models import RemoteFollower
        
        follower, created = await sync_to_async(RemoteFollower.objects.get_or_create)(
            remote_user=remote_user,
            local_user=local_user,
            defaults={"activity_id": activity.get("id"), "accepted": True},
        )
        
        # Auto-accept the follow
        await self._send_accept(local_user, activity)
        
        logger.info(
            f"Remote user {actor_uri} is now following {local_user.username}, "
            f"sent Accept, follower {'created' if created else 'already exists'}"
        )

        return {
            "status": "success",
            "action": "follow_created" if created else "follow_exists",
        }

    async def _handle_accept(self, activity: dict) -> dict:
        """Handle Accept activity (for follow requests)"""
        actor_uri = activity.get("actor")
        object_activity = activity.get("object", {})

        if isinstance(object_activity, dict):
            original_actor = object_activity.get("actor")
            original_object = object_activity.get("object")
        else:
            # Object might be just an ID
            return {"status": "ignored", "reason": "cannot process accept"}

        # Find the follow relationship
        local_user = await self._get_local_user_from_uri(original_actor)
        if not local_user:
            return {"status": "ignored"}

        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        if not remote_user:
            return {"status": "error", "reason": "remote user not found"}

        # Create or update RemoteFollow
        from .models import RemoteFollow
        try:
            follow, created = await sync_to_async(RemoteFollow.objects.get_or_create)(
                follower=local_user,
                remote_user=remote_user,
                defaults={'accepted': True, 'activity_id': activity.get('id', '')}
            )
            if not created and not follow.accepted:
                follow.accepted = True
                await sync_to_async(follow.save)(update_fields=["accepted"])
            
            # Fetch their recent posts
            from .services import ActivityPubService
            ap_service = ActivityPubService()
            await ap_service.fetch_remote_posts(remote_user)
            
            return {"status": "success", "action": "follow_accepted"}
        except Follow.DoesNotExist:
            return {"status": "error", "reason": "follow not found"}

    async def _handle_reject(self, activity: dict) -> dict:
        """Handle Reject activity"""
        # Similar to Accept but marks as rejected
        return {"status": "success", "action": "follow_rejected"}

    async def _handle_create(self, activity: dict) -> dict:
        """Handle Create activity (new post/note)"""
        actor_uri = activity.get("actor")
        obj = activity.get("object", {})

        if not isinstance(obj, dict):
            return {"status": "error", "reason": "invalid object"}

        object_type = obj.get("type")
        if object_type not in ["Note", "Article"]:
            return {
                "status": "ignored",
                "reason": f"unsupported object type: {object_type}",
            }

        # Get remote user
        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        if not remote_user:
            return {"status": "error", "reason": "could not fetch remote actor"}

        # Create post from note
        content = obj.get("content", "")
        activity_id = obj.get("id", "")
        published = obj.get("published")

        # Check if post already exists
        existing = await sync_to_async(
            Post.objects.filter(federated_id=activity_id).first
        )()
        if existing:
            return {"status": "ignored", "reason": "post already exists"}

        # Create post
        post = await sync_to_async(Post.objects.create)(
            author_id=remote_user.id,  # This won't work - need to handle remote authors
            content=content,
            federated_id=activity_id,
            activity_id=activity_id,
            visibility=2,  # Local visibility for federated content
            local_only=False,
        )

        return {"status": "success", "action": "post_created", "post_id": str(post.id)}

    async def _handle_update(self, activity: dict) -> dict:
        """Handle Update activity (edit post)"""
        obj = activity.get("object", {})
        if not isinstance(obj, dict):
            return {"status": "error", "reason": "invalid object"}

        activity_id = obj.get("id")
        content = obj.get("content")

        # Find and update post
        post = await sync_to_async(
            Post.objects.filter(federated_id=activity_id).first
        )()
        if not post:
            return {"status": "ignored", "reason": "post not found"}

        post.content = content
        await sync_to_async(post.save)(update_fields=["content", "updated_at"])

        return {"status": "success", "action": "post_updated"}

    async def _handle_delete(self, activity: dict) -> dict:
        """Handle Delete activity"""
        obj = activity.get("object")

        # Object might be string ID or dict
        if isinstance(obj, dict):
            activity_id = obj.get("id")
        else:
            activity_id = obj

        # Delete post if exists
        deleted = await sync_to_async(
            Post.objects.filter(federated_id=activity_id).delete
        )()

        return {
            "status": "success",
            "action": "deleted" if deleted[0] > 0 else "not_found",
        }

    async def _handle_like(self, activity: dict) -> dict:
        """Handle Like activity"""
        actor_uri = activity.get("actor")
        object_uri = activity.get("object")

        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        if not remote_user:
            return {"status": "error", "reason": "remote user not found"}

        # Find post
        post = await sync_to_async(Post.objects.filter(activity_id=object_uri).first)()
        if not post:
            return {"status": "ignored", "reason": "post not found"}

        # Create like
        like, created = await sync_to_async(Like.objects.get_or_create)(
            user_id=remote_user.id,  # Same issue - need remote user handling
            post=post,
            defaults={"activity_id": activity.get("id")},
        )

        return {
            "status": "success",
            "action": "like_created" if created else "like_exists",
        }

    async def _handle_announce(self, activity: dict) -> dict:
        """Handle Announce activity (boost/share)"""
        # TODO: Implement boost functionality
        return {"status": "ignored", "reason": "announce not implemented"}

    async def _handle_undo(self, activity: dict) -> dict:
        """Handle Undo activity"""
        obj = activity.get("object", {})
        if not isinstance(obj, dict):
            return {"status": "error", "reason": "invalid object"}

        undo_type = obj.get("type")
        if undo_type == "Follow":
            return await self._undo_follow(obj)
        elif undo_type == "Like":
            return await self._undo_like(obj)

        return {"status": "ignored", "reason": f"unsupported undo type: {undo_type}"}

    async def _undo_follow(self, follow_activity: dict) -> dict:
        """Undo a follow"""
        actor_uri = follow_activity.get("actor")
        object_uri = follow_activity.get("object")

        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        local_user = await self._get_local_user_from_uri(object_uri)

        if not remote_user or not local_user:
            return {"status": "error", "reason": "users not found"}

        deleted = await sync_to_async(
            Follow.objects.filter(
                follower_id=remote_user.id, following=local_user
            ).delete
        )()

        return {
            "status": "success",
            "action": "follow_removed" if deleted[0] > 0 else "not_found",
        }

    async def _undo_like(self, like_activity: dict) -> dict:
        """Undo a like"""
        actor_uri = like_activity.get("actor")
        object_uri = like_activity.get("object")

        remote_user = await self._get_or_fetch_remote_user(actor_uri)
        post = await sync_to_async(Post.objects.filter(activity_id=object_uri).first)()

        if not remote_user or not post:
            return {"status": "error", "reason": "user or post not found"}

        deleted = await sync_to_async(
            Like.objects.filter(user_id=remote_user.id, post=post).delete
        )()

        return {
            "status": "success",
            "action": "like_removed" if deleted[0] > 0 else "not_found",
        }

    async def _send_accept(self, local_user: User, follow_activity: dict):
        """Send Accept activity for a follow request"""
        accept_activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Accept",
            "id": f"https://{settings.INSTANCE_DOMAIN}/activities/accept/{follow_activity.get('id', '').split('/')[-1]}",
            "actor": local_user.actor_uri,
            "object": follow_activity,
        }

        # Get follower inbox
        follower_uri = follow_activity.get("actor")
        remote_user = await self._get_or_fetch_remote_user(follower_uri)
        if remote_user and remote_user.inbox_url:
            # Queue delivery
            from .tasks import deliver_activity

            await sync_to_async(deliver_activity.delay)(
                accept_activity, [remote_user.inbox_url]
            )

    async def _get_or_fetch_remote_user(self, actor_uri: str) -> Optional[RemoteUser]:
        """Get remote user from cache/DB or fetch from remote"""
        # Try cache first
        cached = cache.get(f"remote_user:{actor_uri}")
        if cached:
            return cached

        # Try database
        remote_user = await sync_to_async(
            RemoteUser.objects.filter(actor_uri=actor_uri).first
        )()
        if remote_user:
            cache.set(f"remote_user:{actor_uri}", remote_user, 3600)
            return remote_user

        # Fetch from remote
        actor_data = await self.ap_service.fetch_actor(actor_uri)
        if not actor_data:
            return None

        # Create remote user (this is handled in ActivityPubService._cache_remote_user)
        await self.ap_service._cache_remote_user(actor_data)

        # Retrieve newly created user
        remote_user = await sync_to_async(
            RemoteUser.objects.filter(actor_uri=actor_uri).first
        )()
        if remote_user:
            cache.set(f"remote_user:{actor_uri}", remote_user, 3600)

        return remote_user

    async def _get_local_user_from_uri(self, uri: str) -> Optional[User]:
        """Extract username from actor URI and get local user"""
        # URI format: https://domain/users/username or https://domain/api/activitypub/actor/username/
        parts = uri.rstrip("/").split("/")
        username = parts[-1]

        return await sync_to_async(User.objects.filter(username=username).first)()

    async def _log_activity(self, activity: dict, direction: str):
        """Log activity to database"""
        import uuid
        await sync_to_async(Activity.objects.create)(
            activity_id=activity.get("id", f"activity:{uuid.uuid4()}"),
            activity_type=activity.get("type", "Unknown"),
            direction=direction,
            actor_uri=activity.get("actor", ""),
            object_uri=(
                activity.get("object", {}).get("id", "")
                if isinstance(activity.get("object"), dict)
                else activity.get("object", "")
            ),
            raw_activity=activity,
            processed=False,
        )

    async def _mark_activity_processed(self, activity_id: str):
        """Mark activity as processed"""
        await sync_to_async(Activity.objects.filter(activity_id=activity_id).update)(
            processed=True
        )

    async def _mark_activity_error(self, activity_id: str, error: str):
        """Mark activity as error"""
        await sync_to_async(Activity.objects.filter(activity_id=activity_id).update)(
            processed=False, error_message=error
        )
