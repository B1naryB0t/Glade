# backend/accounts/models.py
import secrets
import uuid
from datetime import timedelta

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models
from django.utils import timezone


class User(AbstractUser):
    PRIVACY_CHOICES = [
        (1, "Public"),
        (2, "Local"),
        (3, "Private"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
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

    # Security
    last_password_change = models.DateTimeField(auto_now_add=True)
    require_password_change = models.BooleanField(default=False)

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

        # Sanitize fields
        from backend.services.validation_service import InputValidationService

        if self.display_name:
            self.display_name = InputValidationService.sanitize_plain_text(
                self.display_name
            )[:100]
        if self.bio:
            self.bio = InputValidationService.sanitize_plain_text(self.bio)[:500]

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
    activity_id = models.URLField(blank=True)
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


class EmailVerificationToken(models.Model):
    """Email verification tokens"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="verification_tokens"
    )
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and self.expires_at > timezone.now()


class LoginAttempt(models.Model):
    """Track login attempts for security"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="login_attempts",
    )
    username = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=255, blank=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["username", "ip_address", "-created_at"]),
            models.Index(fields=["ip_address", "-created_at"]),
        ]


class SecurityEvent(models.Model):
    """Track security-related events"""

    EVENT_TYPES = [
        ("password_change", "Password Change"),
        ("email_change", "Email Change"),
        ("ip_change", "IP Address Change"),
        ("suspicious_activity", "Suspicious Activity"),
        ("account_locked", "Account Locked"),
        ("account_unlocked", "Account Unlocked"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="security_events"
    )
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["event_type", "-created_at"]),
        ]
