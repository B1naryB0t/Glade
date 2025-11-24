# backend/federation/services.py
"""
ActivityPub federation service - updated to use consolidated signing.
"""
import json
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

    async def fetch_actor(self, actor_uri: str) -> dict:
        """Fetch remote ActivityPub actor"""
        # Check cache first
        cached = cache.get(f"actor:{actor_uri}")
        if cached:
            return cached

        try:
            response = await self.client.get(actor_uri)
            if response.status_code == 200:
                actor_data = response.json()

                # Cache for 1 hour
                cache.set(f"actor:{actor_uri}", actor_data, 3600)

                # Update/create RemoteUser
                await self._cache_remote_user(actor_data)

                return actor_data

        except Exception as e:
            print(f"Failed to fetch actor {actor_uri}: {e}")

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
