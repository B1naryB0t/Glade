## Privacy Implementation

### Location Fuzzing Algorithm

```python
def apply_location_privacy(lat: float, lng: float, privacy_level: int) -> tuple:
    """
    Apply random offset to coordinates based on privacy level

    Args:
        lat: Original latitude
        lng: Original longitude
        privacy_level: 1=Public(100m), 2=Local(100m), 3=Private(300m)

    Returns:
        (fuzzed_lat, fuzzed_lng)
    """
    max_fuzz = LOCATION_FUZZING_RADIUS * (3 if privacy_level >= 3 else 1)

    # Random polar coordinates
    offset = random.uniform(0, max_fuzz)
    bearing = random.uniform(0, 2 * math.pi)

    # Convert to lat/lng offset (approximate)
    lat_offset = (offset * math.cos(bearing)) / 111320
    lng_offset = (offset * math.sin(bearing)) / (111320 * math.cos(math.radians(lat)))

    return lat + lat_offset, lng + lng_offset
```

### Post Visibility Logic

```python
def can_user_see_post(user: User, post: Post) -> bool:
    """
    Determine if user can view post based on visibility settings

    Rules:
    - Author always sees own posts
    - Public (1): All users
    - Local (2): Users within location_radius
    - Followers (3): Accepted followers only
    - Private (4): Author only
    """
    if post.author == user:
        return True

    if post.visibility == 1:  # Public
        return True
    elif post.visibility == 4:  # Private
        return False
    elif post.visibility == 3:  # Followers
        return Follow.objects.filter(
            follower=user,
            following=post.author,
            accepted=True
        ).exists()
    elif post.visibility == 2:  # Local
        if not user.approximate_location or not post.location:
            return False
        radius = post.location_radius or DEFAULT_LOCATION_RADIUS
        distance = user.approximate_location.distance(post.location)
        return distance <= D(m=radius)

    return False
```

### Email Privacy

- Emails hashed using SHA-256 for some use cases
- Plain email stored for communication (verification, notifications)
- Email never exposed in ActivityPub actor objects
- Email visibility controlled at API serializer level

---

## Performance Optimization
