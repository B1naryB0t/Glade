# backend/federation/urls.py
from django.urls import path

from . import views

app_name = "federation"

urlpatterns = [
    # Well-known endpoints
    path(".well-known/webfinger", views.webfinger, name="webfinger"),
    path(".well-known/nodeinfo", views.nodeinfo_discovery,
         name="nodeinfo_discovery"),
    path("nodeinfo/2.0", views.nodeinfo, name="nodeinfo"),
    # ActivityPub endpoints
    path("users/", views.actor_view, name="actor"),
    path("users//inbox", views.inbox_view, name="user_inbox"),
    path("users//outbox", views.outbox_view, name="user_outbox"),
    path("users//followers", views.followers_view, name="followers"),
    path("users//following", views.following_view, name="following"),
    path("inbox", views.shared_inbox_view, name="shared_inbox"),
    path("posts/", views.post_view, name="post_object"),
]
