import pytest
from django.conf import settings
from django.test import Client
from django.contrib.auth import get_user_model
from posts.models import Post


@pytest.fixture(scope="session")
def django_db_setup():
    """Use PostGIS backend with automatic pytest-django DB setup."""
    settings.DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"
    settings.DATABASES["default"]["NAME"] = "glade_test"
    # ✅ Do NOT call migrate here — pytest-django handles it automatically.


@pytest.fixture
def api_client():
    """Provide a Django test client for API tests."""
    return Client()


@pytest.fixture
def mock_redis(monkeypatch):
    """Mock Redis using fakeredis for isolated tests."""
    import fakeredis
    monkeypatch.setattr("redis.Redis", fakeredis.FakeRedis)
    return fakeredis.FakeRedis()


@pytest.fixture
def celery_eager(settings):
    """Run Celery tasks synchronously during tests."""
    settings.CELERY_TASK_ALWAYS_EAGER = True
    yield

@pytest.fixture
def user(db):
    User = get_user_model()
    return User.objects.create_user(username="testuser", password="password123")


@pytest.fixture
def user_with_bio(db):
    """A user with display name and bio for ActivityPub actor tests."""
    User = get_user_model()
    return User.objects.create_user(
        username="biouser",
        email="bio@example.com",
        password="password123",
        display_name="Testy McTestface",
        bio="This is a test bio for ActivityPub testing."
    )

@pytest.fixture
def post(db, user):
    """A simple post linked to a test user"""
    return Post.objects.create(
        author=user,
        content="This is a test post"
    )