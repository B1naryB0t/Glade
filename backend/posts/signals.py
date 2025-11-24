# backend/posts/signals.py
# Federation signals disabled - needs proper implementation
# TODO: Re-enable when federation is fully implemented

# from federation.models import Activity
# from federation.tasks import deliver_activity
# from django.conf import settings
# from django.contrib.auth import get_user_model
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# User = get_user_model()


# @receiver(post_save, sender="posts.Post")
# def post_created_federate(sender, instance, created, **kwargs):
#     if not created:
#         return
#     # Only federate if feature enabled and post is set to federate (local setting)
#     if not settings.FEDERATION_ENABLED:
#         return
#     if instance.local_only:
#         return
#     # TODO: Implement federation delivery
