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

    def __str__(self):
        return self.domain


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

    def __str__(self):
        return self.actor_uri


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
        ("Announce", "Announce"),
        ("Unknown", "Unknown"),
    ]

    DIRECTIONS = [
        ("inbound", "Inbound"),
        ("outbound", "Outbound"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity_id = models.CharField(max_length=1024, unique=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    direction = models.CharField(max_length=10, choices=DIRECTIONS)

    # Related objects
    actor_uri = models.URLField()
    object_uri = models.URLField(blank=True)
    target = models.URLField(blank=True)  # For outbound: target inbox URL

    # Raw data
    raw_activity = models.JSONField()

    # Processing status
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["direction", "-created_at"]),
            models.Index(fields=["activity_type", "direction"]),
            models.Index(fields=["processed"]),
        ]

    def __str__(self):
        return f"{self.activity_type} ({self.direction}) - {self.activity_id}"






class RemoteFollow(models.Model):
    """Track follows to remote users"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='remote_following')
    remote_user = models.ForeignKey(RemoteUser, on_delete=models.CASCADE, related_name='local_followers')
    
    activity_id = models.URLField(blank=True)
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'remote_user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.follower.username} -> {self.remote_user.actor_uri}"


class RemotePost(models.Model):
    """Cache posts from remote users"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    remote_user = models.ForeignKey(RemoteUser, on_delete=models.CASCADE, related_name='posts')
    
    # ActivityPub fields
    activity_id = models.URLField(unique=True)
    content = models.TextField()
    published = models.DateTimeField()
    
    # Optional fields
    summary = models.TextField(blank=True, null=True, default='')  # Content warning
    in_reply_to = models.URLField(blank=True, null=True, default='')
    
    # Metadata
    fetched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-published']
        indexes = [
            models.Index(fields=['-published']),
        ]
    
    def __str__(self):
        return f"{self.remote_user.username}: {self.content[:50]}"
