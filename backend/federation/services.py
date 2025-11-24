# backend/federation/services.py
"""
ActivityPub federation service - updated to use consolidated signing.
"""
import json
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from accounts.models import User
from django.conf import settings
from django.core.cache import cache

from .models import Activity, RemoteInstance, RemoteUser
from .signing import sign_request


class ActivityPubService:
    """Handle ActivityPub federation"""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": f"Glade/{settings.INSTANCE_DOMAIN}",
                "Accept": "application/activity+json, application/ld+json",
            },
        )

    async def send_activity(self, sender: User, activity: dict, inbox_url: str) -> bool:
        """Send ActivityPub activity to remote inbox"""
        try:
            # Serialize activity
            activity_json = json.dumps(activity, separators=(",", ":"))
            body = activity_json.encode("utf-8")

            # Prepare request components
            parsed_url = urlparse(inbox_url)
            now = datetime.now(timezone.utc)
            date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")

            # Sign request using consolidated signing utility
            private_key_pem = sender.private_key.encode("utf-8")
            key_id = f"{sender.actor_uri}#main-key"

            sig_headers = sign_request(
                private_key_pem=private_key_pem,
                key_id=key_id,
                method="POST",
                path=parsed_url.path or "/",
                host=parsed_url.netloc,
                body=body,
                date=date,
            )

            # Add required headers
            headers = {
                "Content-Type": "application/activity+json",
                "Host": parsed_url.netloc,
                **sig_headers,
            }

            # Send request
            response = await self.client.post(inbox_url, content=body, headers=headers)

            # Log activity
            await self._log_activity(
                activity, "outbound", response.status_code >= 400, inbox_url
            )

            return response.status_code in [200, 201, 202]

        except Exception as e:
            print(f"Failed to send activity to {inbox_url}: {e}")
            await self._log_activity(activity, "outbound", True, inbox_url, str(e))
            return False

    async def follow_remote_user(self, local_user: User, actor_uri: str) -> dict:
        """Send Follow activity to remote user"""
        # Fetch remote actor to get inbox
        actor_data = await self.fetch_actor(actor_uri)
        if not actor_data:
            raise Exception(f"Could not fetch actor {actor_uri}")
        
        inbox_url = actor_data.get("inbox")
        if not inbox_url:
            raise Exception("No inbox URL in actor data")
        
        # Create Follow activity
        follow_id = f"https://{settings.INSTANCE_DOMAIN}/activities/{uuid.uuid4()}"
        activity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Follow",
            "id": follow_id,
            "actor": local_user.actor_uri,
            "object": actor_uri
        }
        
        # Send to remote inbox
        success = await self.send_activity(local_user, activity, inbox_url)
        
        if success:
            # Store in database as pending
            from .models import RemoteUser, RemoteInstance
            from asgiref.sync import sync_to_async
            from urllib.parse import urlparse
            
            domain = urlparse(actor_uri).netloc
            instance, _ = await sync_to_async(RemoteInstance.objects.get_or_create)(domain=domain)
            
            remote_user, _ = await sync_to_async(RemoteUser.objects.get_or_create)(
                actor_uri=actor_uri,
                defaults={
                    "instance": instance,
                    "username": actor_data.get("preferredUsername", ""),
                    "display_name": actor_data.get("name", ""),
                    "summary": actor_data.get("summary", ""),
                    "avatar_url": actor_data.get("icon", {}).get("url", ""),
                    "inbox_url": inbox_url,
                    "outbox_url": actor_data.get("outbox", ""),
                    "public_key": actor_data.get("publicKey", {}).get("publicKeyPem", ""),
                }
            )
            
            return {
                "status": "requested",
                "following": False,
                "requested": True,
                "message": "Follow request sent"
            }
        else:
            raise Exception("Failed to send follow activity")

    async def fetch_remote_posts(self, remote_user) -> int:
        """Fetch recent posts from a remote user's outbox"""
        from .models import RemotePost
        from asgiref.sync import sync_to_async
        from dateutil import parser as date_parser
        
        if not remote_user.outbox_url:
            print(f"No outbox URL for {remote_user.username}")
            return 0
        
        try:
            print(f"Fetching from {remote_user.outbox_url}")
            response = await self.client.get(remote_user.outbox_url)
            if response.status_code != 200:
                print(f"Got status {response.status_code}")
                return 0
            
            outbox_data = response.json()
            
            # Handle paginated outbox (Mastodon style)
            if 'first' in outbox_data and 'orderedItems' not in outbox_data:
                first_page_url = outbox_data['first']
                print(f"Following pagination to {first_page_url}")
                response = await self.client.get(first_page_url)
                if response.status_code != 200:
                    return 0
                outbox_data = response.json()
            
            items = outbox_data.get('orderedItems', [])[:20]  # Get last 20 posts
            print(f"Found {len(items)} items in outbox")
            
            posts_created = 0
            for item in items:
                print(f"Processing item type: {item.get('type')}")
                if item.get('type') == 'Create':
                    note = item.get('object', {})
                    print(f"  Note type: {note.get('type')}, id: {note.get('id')}")
                    if note.get('type') == 'Note':
                        # Store post
                        created = await sync_to_async(RemotePost.objects.get_or_create)(
                            activity_id=note.get('id'),
                            defaults={
                                'remote_user': remote_user,
                                'content': note.get('content', ''),
                                'published': date_parser.parse(note.get('published')),
                                'summary': note.get('summary', ''),
                                'in_reply_to': note.get('inReplyTo', ''),
                            }
                        )
                        print(f"  Created: {created[1]}, Post ID: {created[0].id}")
                        posts_created += 1
            
            print(f"Total posts created: {posts_created}")
            return posts_created
        except Exception as e:
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching posts from {remote_user.actor_uri}: {e}")
            print(f"Exception: {e}")
            print(traceback.format_exc())
            return 0

    async def fetch_actor(self, actor_uri: str, signed_by: User = None) -> dict:
        """Fetch remote ActivityPub actor, optionally with signed request"""
        # Check cache first
        cached = cache.get(f"actor:{actor_uri}")
        if cached:
            return cached

        try:
            headers = {
                "Accept": "application/activity+json, application/ld+json",
            }
            
            # If signed request is needed, add signature
            if signed_by:
                from urllib.parse import urlparse
                parsed_url = urlparse(actor_uri)
                now = datetime.now(timezone.utc)
                date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")
                
                private_key_pem = signed_by.private_key.encode("utf-8")
                key_id = f"{signed_by.actor_uri}#main-key"
                
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
            
            response = await self.client.get(actor_uri, headers=headers)
            
            if response.status_code == 200:
                actor_data = response.json()

                # Cache for 1 hour
                cache.set(f"actor:{actor_uri}", actor_data, 3600)

                # Update/create RemoteUser
                await self._cache_remote_user(actor_data)

                return actor_data

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Exception fetching actor {actor_uri}: {e}", exc_info=True)

        return {}

    async def _cache_remote_user(self, actor_data: dict):
        """Cache remote user data"""
        from asgiref.sync import sync_to_async

        actor_uri = actor_data.get("id")
        if not actor_uri:
            return

        # Extract domain
        domain = urlparse(actor_uri).netloc
        instance, _ = await sync_to_async(RemoteInstance.objects.get_or_create)(
            domain=domain
        )

        # Update or create remote user
        await sync_to_async(RemoteUser.objects.update_or_create)(
            actor_uri=actor_uri,
            defaults={
                "instance": instance,
                "username": actor_data.get("preferredUsername", ""),
                "display_name": actor_data.get("name", ""),
                "summary": actor_data.get("summary", ""),
                "avatar_url": actor_data.get("icon", {}).get("url", ""),
                "inbox_url": actor_data.get("inbox", ""),
                "outbox_url": actor_data.get("outbox", ""),
                "public_key": actor_data.get("publicKey", {}).get("publicKeyPem", ""),
            },
        )

    async def _log_activity(
        self,
        activity: dict,
        direction: str,
        error: bool = False,
        target: str = "",
        error_msg: str = "",
    ):
        """Log ActivityPub activity"""
        from asgiref.sync import sync_to_async

        await sync_to_async(Activity.objects.create)(
            activity_id=activity.get("id", ""),
            activity_type=activity.get("type", ""),
            direction=direction,
            actor_uri=activity.get("actor", ""),
            object_uri=(
                activity.get("object", {}).get("id", "")
                if isinstance(activity.get("object"), dict)
                else activity.get("object", "")
            ),
            raw_activity=activity,
            processed=not error,
            error_message=error_msg,
            target=target,
        )
