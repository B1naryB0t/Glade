# backend/glade/urls.py (MAIN URL CONFIG)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from federation import views as federation_views
from federation import mastodon_api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/posts/", include("posts.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/instance", federation_views.instance_info, name="instance_v1"),
    path("api/v2/instance", federation_views.instance_info, name="instance_v2"),
    # Mastodon-compatible timeline endpoints
    path("api/v1/timelines/home", mastodon_api.timeline_home, name="timeline_home"),
    path("api/v1/timelines/public", mastodon_api.timeline_public, name="timeline_public"),
    path("api/v1/timelines/local", mastodon_api.timeline_local, name="timeline_local"),
    # Mastodon-compatible status endpoints
    path("api/v1/statuses", mastodon_api.create_status, name="create_status"),
    path("api/v1/statuses/<uuid:status_id>", mastodon_api.status_detail, name="status_detail"),
    path("api/v1/statuses/<uuid:status_id>/favourite", mastodon_api.favourite_status, name="favourite_status"),
    path("api/v1/statuses/<uuid:status_id>/unfavourite", mastodon_api.unfavourite_status, name="unfavourite_status"),
    # Mastodon-compatible account endpoints
    path("api/v1/accounts/<uuid:account_id>", mastodon_api.get_account, name="get_account"),
    path("api/v1/accounts/verify_credentials", mastodon_api.verify_credentials, name="verify_credentials"),
    path("api/v1/accounts/<uuid:account_id>/statuses", mastodon_api.account_statuses, name="account_statuses"),
    path("api/v1/accounts/<uuid:account_id>/follow", mastodon_api.follow_account, name="follow_account"),
    path("api/v1/accounts/<uuid:account_id>/unfollow", mastodon_api.unfollow_account, name="unfollow_account"),
    path("api/v1/accounts/<uuid:account_id>/followers", mastodon_api.account_followers, name="account_followers"),
    path("api/v1/accounts/<uuid:account_id>/following", mastodon_api.account_following, name="account_following"),
    # OAuth2 endpoints (django-oauth-toolkit)
    path("oauth/", include("oauth2_provider.urls", namespace="oauth2_provider")),
    # OAuth app management
    path("api/v1/", include("oauth_app.urls")),
    path("", include("federation.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
