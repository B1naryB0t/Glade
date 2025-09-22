# backend/models/post.py
import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    content_warning = Column(Text)

    # Privacy and visibility
    # 1=public, 2=local, 3=followers, 4=private
    visibility = Column(Integer, default=2)
    location = Column(Geometry("POINT", srid=4326))
    location_radius = Column(Integer)  # Visibility radius in meters
    local_only = Column(Boolean, default=False)

    # Federation
    federated_id = Column(String(255), unique=True)  # ActivityPub ID
    reply_to_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="posts")
    replies = relationship("Post", back_populates="reply_to", remote_side=[id])
    reply_to = relationship("Post", back_populates="replies", remote_side=[id])

    def to_activitypub_note(self, domain: str) -> dict:
        """Convert post to ActivityPub Note object"""
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Note",
            "id": f"https://{domain}/posts/{self.id}",
            "published": self.created_at.isoformat(),
            "attributedTo": f"https://{domain}/users/{self.author.username}",
            "content": self.content,
            "contentMap": {"en": self.content},
            "to": self._get_to_field(),
            "cc": self._get_cc_field(),
            "sensitive": bool(self.content_warning),
            "summary": self.content_warning if self.content_warning else None,
        }

    def _get_to_field(self) -> list:
        if self.visibility == 1:  # public
            return ["https://www.w3.org/ns/activitystreams#Public"]
        return []

    def _get_cc_field(self) -> list:
        if self.visibility == 2:  # local
            return [
                f"https://{settings.INSTANCE_DOMAIN}/users/{self.author.username}/followers"
            ]
        return []
