from sqlite3 import IntegrityError
import pytest

from posts.models import Like


@pytest.mark.django_db
def test_like_uniqueness(user, post):
    Like.objects.create(user=user, post=post)
    with pytest.raises(IntegrityError):
        Like.objects.create(user=user, post=post)