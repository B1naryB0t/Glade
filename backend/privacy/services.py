import math
import random
from typing import Optional, Tuple

from accounts.models import Follow, User
from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from posts.models import Post


class PrivacyService:
    """Handle privacy-related operations"""

    def apply_location_privacy(
        self, lat: float, lng: float, privacy_level: int = 2
    ) -> Tuple[float, float]:
        """Apply location fuzzing based on privacy level"""
        if privacy_level >= 3:  # High privacy
            max_fuzz = settings.LOCATION_FUZZING_RADIUS * 3
        else:
            max_fuzz = settings.LOCATION_FUZZING_RADIUS

        # Apply random offset within fuzzing radius
        offset = random.uniform(0, max_fuzz)
        bearing = random.uniform(0, 2 * math.pi)

        # Convert to coordinate offset (approximate)
        lat_offset = (offset * math.cos(bearing)) / 111320  # meters to degrees
        lng_offset = (offset * math.sin(bearing)) / (
            111320 * math.cos(math.radians(lat))
        )

        return lat + lat_offset, lng + lng_offset

    def can_user_see_post(self, user: User, post: Post) -> bool:
        """Check if user can see a post based on privacy rules"""
        # Author can always see their own posts
        if post.author == user:
            return True

        # Check visibility level
        if post.visibility == 1:  # Public
            return True
        elif post.visibility == 4:  # Private
            return False
        elif post.visibility == 3:  # Followers only
            return self._is_follower(user, post.author)
        elif post.visibility == 2:  # Local
            return self._is_in_local_area(user, post)

        return False

    def _is_follower(self, follower: User, following: User) -> bool:
        """Check if user follows another user"""
        return Follow.objects.filter(
            follower=follower, following=following, accepted=True
        ).exists()

    def _is_in_local_area(self, user: User, post: Post) -> bool:
        """Check if user is in the local area for a post"""
        if not user.approximate_location or not post.location:
            return False

        # Use post's location radius or default
        radius = post.location_radius or settings.DEFAULT_LOCATION_RADIUS

        # Calculate distance
        distance = user.approximate_location.distance(post.location)
        return distance <= D(m=radius)
