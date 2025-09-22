# backend/services/location_service.py
import math
import random
from typing import List, Optional, Tuple

from geoalchemy2.functions import ST_Distance, ST_DWithin
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.models.post import Post
from backend.models.user import User


class LocationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def apply_location_fuzzing(self, lat: float, lon: float) -> Tuple[float, float]:
        """Apply privacy-focused fuzzing to coordinates"""
        # Random offset within fuzzing radius
        offset_m = random.uniform(0, settings.LOCATION_FUZZING_RADIUS)
        bearing = random.uniform(0, 2 * math.pi)

        # Convert to lat/lon offset (approximate)
        lat_offset = (offset_m * math.cos(bearing)) / 111320
        lon_offset = (offset_m * math.sin(bearing)) / (
            111320 * math.cos(math.radians(lat))
        )

        return lat + lat_offset, lon + lon_offset

    async def get_nearby_posts(
        self, user: User, radius_m: Optional[int] = None, limit: int = 50
    ) -> List[Post]:
        """Get posts near user's location"""
        if not user.approximate_location:
            return []

        radius = radius_m or user.location_privacy_radius

        query = (
            select(Post)
            .where(
                Post.location.isnot(None),
                ST_DWithin(Post.location, user.approximate_location, radius),
            )
            .order_by(Post.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_nearby_users(
        self, user: User, radius_m: Optional[int] = None, limit: int = 20
    ) -> List[User]:
        """Get users near the given user"""
        if not user.approximate_location:
            return []

        radius = radius_m or user.location_privacy_radius

        query = (
            select(User)
            .where(
                User.id != user.id,
                User.approximate_location.isnot(None),
                User.privacy_level <= 2,  # Only public/local users
                ST_DWithin(
                    User.approximate_location, user.approximate_location, radius
                ),
            )
            .limit(limit)
        )

        result = await self.db.execute(query)
        return result.scalars().all()
