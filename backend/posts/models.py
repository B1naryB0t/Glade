# backend/posts/models.py
import uuid
from django.conf import settings
from django.contrib.gis.db import models


class Post(models.Model):
    VISIBILITY_CHOICES = [
        (1, "Public"),  # Visible everywhere
        (2, "Local"),  # Local instance + nearby
        (3, "Followers"),  # Followers only
        (4, "Private"),  # Author only
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )
    content = models.TextField()
    content_warning = models.CharField(max_length=200, blank=True)

    # Privacy and location
    visibility = models.IntegerField(choices=VISIBILITY_CHOICES, default=2)
    location = models.PointField(srid=4326, blank=True, null=True)
    location_radius = models.IntegerField(
        blank=True, null=True
    )  # Visibility radius in meters
    local_only = models.BooleanField(default=False)

    # Federation
    activity_id = models.URLField(blank=True, unique=True)  # ActivityPub object ID
    # Original object ID if federated from remote
    federated_id = models.URLField(blank=True)
    reply_to = models.ForeignKey(
        "self", on_delete=models.CASCADE, blank=True, null=True, related_name="replies"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["visibility"]),
        ]

    def save(self, *args, **kwargs):
        # Set ActivityPub ID for new posts
        if not self.activity_id:
            self.activity_id = f"https://{settings.INSTANCE_DOMAIN}/posts/{self.id}"
        super().save(*args, **kwargs)

    def to_activitypub_note(self):
        """Convert post to ActivityPub Note object"""
        note = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Note",
            "id": self.activity_id,
            "published": self.created_at.isoformat(),
            "attributedTo": self.author.actor_uri,
            "content": self.content,
            "contentMap": {"en": self.content},
            "to": self._get_to_field(),
            "cc": self._get_cc_field(),
            "sensitive": bool(self.content_warning),
        }

        if self.content_warning:
            note["summary"] = self.content_warning

        if self.reply_to:
            note["inReplyTo"] = self.reply_to.activity_id

        # Glade location extension
        if self.location and not self.local_only:
            note["glade:location"] = {
                "type": "Place",
                "glade:approximate": True,
                "glade:radius": self.location_radius,
            }

        return note

    def _get_to_field(self):
        """Get ActivityPub 'to' field based on visibility"""
        if self.visibility == 1:  # Public
            return ["https://www.w3.org/ns/activitystreams#Public"]
        elif self.visibility == 3:  # Followers
            return [f"{self.author.actor_uri}/followers"]
        return []

    def _get_cc_field(self):
        """Get ActivityPub 'cc' field"""
        if self.visibility == 1:  # Public
            return [f"{self.author.actor_uri}/followers"]
        elif self.visibility == 2:  # Local
            return [
                f"https://{settings.INSTANCE_DOMAIN}/users/{self.author.username}/followers"
            ]
        return []


class Like(models.Model):
    """Post likes/reactions"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")

    # Federation
    activity_id = models.URLField(blank=True)  # ActivityPub Like activity ID

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")

    def to_activitypub_like(self):
        """Convert to ActivityPub Like activity"""
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Like",
            "id": self.activity_id
            or f"https://{settings.INSTANCE_DOMAIN}/activities/{self.id}",
            "actor": self.user.actor_uri,
            "object": self.post.activity_id,
        }
