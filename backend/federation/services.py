# backend/federation/services.py
import base64
import hashlib
import json
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from accounts.models import User
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from django.conf import settings
from django.core.cache import cache

from .models import Activity, RemoteInstance, RemoteUser


class ActivityPubService:
    """Handle ActivityPub federation"""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0, headers={"User-Agent": f"Glade/{settings.INSTANCE_DOMAIN}"}
        )

    async def send_activity(self, sender: User, activity: dict, inbox_url: str) -> bool:
        """Send ActivityPub activity to remote inbox"""
        try:
            # Serialize activity
            activity_json = json.dumps(activity, separators=(",", ":"))

            # Prepare headers
            now = datetime.now(timezone.utc)
            headers = {
                "Content-Type": "application/activity+json",
                "Date": now.strftime("%a, %d %b %Y %H:%M:%S GMT"),
                "Host": urlparse(inbox_url).netloc,
            }

            # Sign request
            signature = await self._sign_request(
                method="POST",
                url=inbox_url,
                headers=headers,
                body=activity_json,
                private_key_pem=sender.private_key,
                key_id=f"{sender.actor_uri}#main-key",
            )
            headers["Signature"] = signature

            # Send request
            response = await self.client.post(
                inbox_url, content=activity_json, headers=headers
            )

            # Log activity
            await self._log_activity(activity, "outbound", response.status_code >= 400)

            return response.status_code in [200, 201, 202]

        except Exception as e:
            print(f"Failed to send activity to {inbox_url}: {e}")
            await self._log_activity(activity, "outbound", True, str(e))
            return False

    async def fetch_actor(self, actor_uri: str) -> dict:
        """Fetch remote ActivityPub actor"""
        # Check cache first
        cached = cache.get(f"actor:{actor_uri}")
        if cached:
            return cached

        try:
            headers = {"Accept": "application/activity+json, application/ld+json"}

            response = await self.client.get(actor_uri, headers=headers)
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

    @staticmethod
    async def _sign_request(
            method: str,
        url: str,
        headers: dict,
        body: str,
        private_key_pem: str,
        key_id: str,
    ) -> str:
        """Sign HTTP request for ActivityPub"""
        private_key = load_pem_private_key(private_key_pem.encode(), password=None)

        # Add digest for POST requests
        if method.upper() == "POST":
            body_hash = hashlib.sha256(body.encode()).digest()
            digest = f"SHA-256={base64.b64encode(body_hash).decode()}"
            headers["Digest"] = digest

        # Build signature string
        parsed_url = urlparse(url)
        signature_headers = ["(request-target)", "host", "date"]
        if method.upper() == "POST":
            signature_headers.append("digest")

        signature_parts = []
        for header in signature_headers:
            if header == "(request-target)":
                signature_parts.append(
                    f"(request-target): {method.lower()} {parsed_url.path}"
                )
            else:
                signature_parts.append(f"{header}: {headers[header]}")

        signature_string = "\n".join(signature_parts)

        # Sign
        signature = private_key.sign(
            signature_string.encode(), padding.PKCS1v15(), hashes.SHA256()
        )

        signature_b64 = base64.b64encode(signature).decode()

        return f'keyId="{key_id}",algorithm="rsa-sha256",headers="{" ".join(signature_headers)}",signature="{signature_b64}"'

    @staticmethod
    async def _cache_remote_user(actor_data: dict):
        """Cache remote user data"""
        actor_uri = actor_data.get("id")
        if not actor_uri:
            return

        # Extract domain
        domain = urlparse(actor_uri).netloc
        instance, _ = await RemoteInstance.objects.aget_or_create(domain=domain)

        # Update or create remote user
        await RemoteUser.objects.aupdate_or_create(
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

    @staticmethod
    async def _log_activity(
            activity: dict, direction: str, error: bool = False, error_msg: str = ""
    ):
        """Log ActivityPub activity"""
        await Activity.objects.acreate(
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
        )
