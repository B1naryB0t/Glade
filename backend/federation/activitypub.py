# backend/federation/activitypub.py
import json
from datetime import datetime, UTC
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx

from backend.core.config import settings
from backend.models.user import User
from backend.services.crypto_service import sign_request


class ActivityPubService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def send_activity(
        self, actor: User, activity: Dict[str, Any], inbox_url: str
    ) -> bool:
        """Send ActivityPub activity to remote inbox"""
        try:
            activity_json = json.dumps(activity, separators=(",", ":"))

            headers = {
                "Content-Type": "application/activity+json",
                "Date": datetime.now(UTC).strftime("%a, %d %b %Y %H:%M:%S GMT"),
                "Host": urlparse(inbox_url).netloc,
                "User-Agent": f"Glade/{settings.INSTANCE_DOMAIN}",
            }

            # Sign the request
            signature = crypto_service.sign_request(
                method="POST",
                path=urlparse(inbox_url).path,
                headers=headers,
                body=activity_json,
                private_key=actor.private_key,
                key_id=f"https://{settings.INSTANCE_DOMAIN}/users/{actor.username}#main-key",
            )
            headers["Signature"] = signature

            response = await self.client.post(
                inbox_url, content=activity_json, headers=headers
            )

            return response.status_code in [200, 202]

        except Exception as e:
            print(f"Failed to send activity: {e}")
            return False

    async def fetch_actor(self, actor_url: str) -> Optional[Dict[str, Any]]:
        """Fetch remote ActivityPub actor"""
        try:
            headers = {
                "Accept": "application/activity+json, application/ld+json",
                "User-Agent": f"Glade/{settings.INSTANCE_DOMAIN}",
            }

            response = await self.client.get(actor_url, headers=headers)
            if response.status_code == 200:
                return response.json()

        except Exception as e:
            print(f"Failed to fetch actor {actor_url}: {e}")

        return None

    def create_activity(
        self, actor: User, object_data: Dict[str, Any], activity_type: str = "Create"
    ) -> Dict[str, Any]:
        """Create ActivityPub activity"""
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": activity_type,
            "id": f"https://{settings.INSTANCE_DOMAIN}/activities/{object_data.get('id', '')}",
            "actor": f"https://{settings.INSTANCE_DOMAIN}/users/{actor.username}",
            "published": datetime.now(UTC).isoformat() + "Z",
            "object": object_data,
        }
