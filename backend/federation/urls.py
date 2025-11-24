# backend/federation/urls.py
from django.urls import path

from . import instance_views, views

urlpatterns = [
    # Well-known endpoints
    path(".well-known/webfinger", views.webfinger, name="webfinger"),
    path(".well-known/nodeinfo", views.node_info_discovery,
         name="node_info_discovery"),
    path("nodeinfo/2.0", views.node_info, name="node_info"),
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

instance_urlpatterns = [
    # Public instance info
    path("api/instance/info", instance_views.instance_info, name="instance_info"),
    # Authenticated endpoints
    path(
        "api/instance/federation-status",
        instance_views.federation_status,
        name="federation_status",
    ),
    path(
        "api/instance/remote-instances",
        instance_views.remote_instances_list,
        name="remote_instances",
    ),
    path(
        "api/instance/remote-users",
        instance_views.remote_users_list,
        name="remote_users",
    ),
    path("api/instance/activity-log",
         instance_views.activity_log, name="activity_log"),
]
