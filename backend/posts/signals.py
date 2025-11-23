# backend/posts/signals.py
import json

from activitypub.models import Activity
from activitypub.serializers import PostActivitySerializer
from activitypub.tasks import deliver_activity
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


@receiver(post_save, sender="posts.Post")
def post_created_federate(sender, instance, created, **kwargs):
    if not created:
        return
    # Only federate if feature enabled and post is set to federate (local setting)
    if not settings.ACTIVITYPUB_ENABLED:
        return
    if not instance.federated:  # assuming Post model has a 'federated' boolean
        return

    user = instance.author  # assuming Post model has author FK to User
    actor_uri = (
        user.actor_uri or user.get_actor_uri()
    )  # implement get_actor_uri in User model
    # Build to_list: e.g., 'Followers' collection + Public if allowed.
    to_list = instance.get_federation_targets()  # you implement this in post model
    serializer = PostActivitySerializer.from_post(instance, actor_uri, to_list)
    payload = serializer.data
    activity = Activity.objects.create(
        activity_id=payload["id"],
        actor=actor_uri,
        payload=payload,
        direction="outbound",
        status="pending",
    )
    # deliver to each follower inbox
    inboxes = [
        follower.remote_user.inbox for follower in instance.author.followers_remote()
    ]
    # also maybe include public inbox for each remote instance
    deliver_activity.delay(activity.activity_id, inboxes)
