
import pytest

@pytest.mark.django_db
def test_activitypub_actor_generation(user):
    actor = user.to_activitypub_actor()
    assert 'preferredUsername' in actor
    assert 'publicKey' in actor
    
@pytest.mark.django_db
def test_actor_has_bio_and_display_name(user_with_bio):
    actor = user_with_bio.to_activitypub_actor()
    assert actor["name"] == "Testy McTestface"
    assert "ActivityPub" in actor["summary"]

@pytest.mark.django_db
def test_actor_generation(user):
    """Ensure a user's ActivityPub actor JSON is generated correctly."""
    actor = user.to_activitypub_actor()

    assert actor["type"] == "Person"
    assert actor["preferredUsername"] == user.username
    assert "publicKey" in actor
    assert actor["publicKey"]["publicKeyPem"].startswith("-----BEGIN PUBLIC KEY-----")
    assert actor["id"].startswith(f"https://")






