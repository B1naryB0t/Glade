# backend/accounts/models.py

import uuid

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models


class User(AbstractUser):
    PRIVACY_CHOICES = [
        (1, "Public"),
        (2, "Local"),
        (3, "Private"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # Privacy settings
    privacy_level = models.IntegerField(choices=PRIVACY_CHOICES, default=2)
    location_privacy_radius = models.IntegerField(default=1000)  # meters
    approximate_location = models.PointField(srid=4326, blank=True, null=True)

    # Federation
    federation_enabled = models.BooleanField(default=True)
    actor_uri = models.URLField(blank=True)
    public_key = models.TextField(blank=True)
    private_key = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Generate keypair for new users
        if not self.public_key and not self.private_key:
            self._generate_keypair()

        # Set actor URI
        if not self.actor_uri:
            self.actor_uri = f"https://{settings.INSTANCE_DOMAIN}/users/{self.username}"

        super().save(*args, **kwargs)

    def _generate_keypair(self):
        """Generate RSA keypair for ActivityPub signatures"""
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        # Serialize private key
        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

        # Serialize public key
        public_key = private_key.public_key()
        self.public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

    def to_activitypub_actor(self):
        """Convert user to ActivityPub Actor object"""
        return {
            "@context": [
                "https://www.w3.org/ns/activitystreams",
                "https://w3id.org/security/v1",
            ],
            "type": "Person",
            "id": self.actor_uri,
            "preferredUsername": self.username,
            "name": self.display_name or self.username,
            "summary": self.bio,
            "inbox": f"https://{settings.INSTANCE_DOMAIN}/users/{self.username}/inbox",
            "outbox": f"https://{settings.INSTANCE_DOMAIN}/users/{self.username}/outbox",
            "followers": f"https://{settings.INSTANCE_DOMAIN}/users/{self.username}/followers",
            "following": f"https://{settings.INSTANCE_DOMAIN}/users/{self.username}/following",
            "publicKey": {
                "id": f"{self.actor_uri}#main-key",
                "owner": self.actor_uri,
                "publicKeyPem": self.public_key,
            },
            "endpoints": {"sharedInbox": f"https://{settings.INSTANCE_DOMAIN}/inbox"},
            # Glade-specific extensions
            "glade:location": (
                {
                    "type": "Place",
                    "glade:privacyRadius": self.location_privacy_radius,
                    "glade:approximateLocation": bool(self.approximate_location),
                }
                if self.approximate_location
                else None
            ),
        }

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return f"https://ui-avatars.com/api/?name={self.display_name or self.username}"


class Follow(models.Model):
    """Follow relationships between users"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="followers"
    )

    # Federation
    activity_id = models.URLField(blank=True)  # ActivityPub Follow activity ID
    accepted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")

    def to_activitypub_follow(self):
        """Convert to ActivityPub Follow activity"""
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Follow",
            "id": self.activity_id,
            "actor": self.follower.actor_uri,
            "object": self.following.actor_uri,
        }
