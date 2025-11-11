
import pytest
from django.contrib.auth import get_user_model

@pytest.fixture
def user(db):
    User = get_user_model()
    return User.objects.create_user(username="testuser", password="password123")

@pytest.mark.django_db
def test_user_registration_endpoint(client):
    response = client.get('/api/v1/auth/register/')
    assert response.status_code in (200, 405)


