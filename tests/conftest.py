# backend/tests/conftest.py
import pytest
from django.contrib.auth import get_user_model
from posts.models import Post


@pytest.fixture
def user(db):
    """Basic test user fixture."""
    User = get_user_model()
    return User.objects.create_user(
        username="testuser",
        password="password123",
        email="test@example.com",
    )


@pytest.fixture
def user_with_bio(user):
    """User with display name and bio for ActivityPub tests."""
    user.display_name = "Testy McTestface"
    user.bio = "Loves testing ActivityPub and PostGIS."
    user.save()
    return user


@pytest.fixture
def post(user, db):
    """Basic Post fixture linked to a user."""
    return Post.objects.create(
        author=user,
        content="This is a test post for federation testing.",
        visibility="public",  # adjust if your Post model uses a different field
    )
