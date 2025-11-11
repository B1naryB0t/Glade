import pytest

@pytest.mark.django_db
def test_post_creation_and_actor(post):
    """Verify that a Post is tied to a valid ActivityPub actor."""
    assert post.author.username == "testuser"
    actor = post.author.to_activitypub_actor()
    assert actor["type"] == "Person"
    assert "https://" in actor["id"]
    assert "publicKey" in actor
