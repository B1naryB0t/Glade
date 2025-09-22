# backend/models/user.py
import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email_hash = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))

    # Privacy settings
    privacy_level = Column(Integer, default=2)  # 1=public, 2=local, 3=private
    location_privacy_radius = Column(Integer, default=1000)
    approximate_location = Column(Geometry("POINT", srid=4326))

    # Federation
    federation_enabled = Column(Boolean, default=True)
    actor_url = Column(String(500), unique=True)
    public_key = Column(Text)
    private_key = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_active_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_activitypub_actor(self, domain: str) -> dict:
        """Convert user to ActivityPub Actor object"""
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Person",
            "id": f"https://{domain}/users/{self.username}",
            "preferredUsername": self.username,
            "name": self.display_name or self.username,
            "summary": self.bio or "",
            "inbox": f"https://{domain}/users/{self.username}/inbox",
            "outbox": f"https://{domain}/users/{self.username}/outbox",
            "followers": f"https://{domain}/users/{self.username}/followers",
            "following": f"https://{domain}/users/{self.username}/following",
            "publicKey": {
                "id": f"https://{domain}/users/{self.username}#main-key",
                "owner": f"https://{domain}/users/{self.username}",
                "publicKeyPem": self.public_key,
            },
            "endpoints": {"sharedInbox": f"https://{domain}/inbox"},
        }
