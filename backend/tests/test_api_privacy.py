import pytest


@pytest.mark.django_db
def test_unauthorized_post_creation(api_client):
    response = api_client.post("/api/posts/", {"content": "hi"})
    assert response.status_code == 403