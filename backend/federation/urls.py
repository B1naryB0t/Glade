# backend/federation/urls.py
from django.urls import path
import views

urlpatterns = [
    # Well-known endpoints
    path(".well-known/webfinger", views.webfinger, name="webfinger"),
    path(".well-known/nodeinfo", views.nodeinfo_discovery, name="nodeinfo_discovery"),
    path("nodeinfo/2.0", views.nodeinfo, name="nodeinfo"),
    # ActivityPub endpoints
    path("users/<str:username>", views.actor_view, name="actor"),
    path("users/<str:username>/inbox", views.inbox_view, name="user_inbox"),
    # TODO: Implement these views before uncommenting
    # path("users/<str:username>/outbox", views.outbox_view, name="user_outbox"),
    # path("users/<str:username>/followers", views.followers_view, name="followers"),
    # path("users/<str:username>/following", views.following_view, name="following"),
    path("inbox", views.shared_inbox_view, name="shared_inbox"),
    path("posts/<uuid:post_id>", views.post_view, name="post_object"),
]
