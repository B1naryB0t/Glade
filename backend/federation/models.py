# backend/federation/models.py
import uuid
from django.db import models


class RemoteInstance(models.Model):
    """Track federated instances"""

    TRUST_LEVELS = [
        (0, "Blocked"),
        (1, "Limited"),
        (2, "Trusted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    domain = models.CharField(max_length=255, unique=True)
    # mastodon, pleroma, glade, etc.
    software = models.CharField(max_length=50, blank=True)
    version = models.CharField(max_length=20, blank=True)
    trust_level = models.IntegerField(choices=TRUST_LEVELS, default=1)

    # ActivityPub endpoints
    shared_inbox = models.URLField(blank=True)
    public_key = models.TextField(blank=True)

    # Statistics
    user_count = models.IntegerField(default=0)
    post_count = models.IntegerField(default=0)

    # Timestamps
    last_seen_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["domain"]


class RemoteUser(models.Model):
    """Cache remote ActivityPub users"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instance = models.ForeignKey(RemoteInstance, on_delete=models.CASCADE)

    # ActivityPub fields
    actor_uri = models.URLField(unique=True)
    username = models.CharField(max_length=50)
    display_name = models.CharField(max_length=100, blank=True)
    summary = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)

    # ActivityPub endpoints
    inbox_url = models.URLField()
    outbox_url = models.URLField(blank=True)
    public_key = models.TextField()

    # Cache metadata
    last_fetched_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("instance", "username")


class Activity(models.Model):
    """Log ActivityPub activities for debugging"""

    ACTIVITY_TYPES = [
        ("Create", "Create"),
        ("Update", "Update"),
        ("Delete", "Delete"),
        ("Follow", "Follow"),
        ("Accept", "Accept"),
        ("Reject", "Reject"),
        ("Like", "Like"),
        ("Undo", "Undo"),
    ]

    DIRECTIONS = [
        ("inbound", "Inbound"),
        ("outbound", "Outbound"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity_id = models.URLField(unique=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    direction = models.CharField(max_length=10, choices=DIRECTIONS)

    # Related objects
    actor_uri = models.URLField()
    object_uri = models.URLField(blank=True)

    # Raw data
    raw_activity = models.JSONField()

    # Processing status
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
