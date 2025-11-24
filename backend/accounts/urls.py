# backend/accounts/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("verify-email/<str:token>/", views.verify_email, name="verify-email"),
    path(
        "resend-verification/",
        views.resend_verification_email,
        name="resend-verification",
    ),
    path(
        "profile/<str:username>/", views.UserProfileView.as_view(), name="user-profile"
    ),
    path("profile/<str:username>/avatar/",
         views.upload_avatar, name="upload-avatar"),
    path("follow/<str:username>/", views.follow_user, name="follow-user"),
    path("follow/", views.follow_user_by_uri, name="follow-user-uri"),
    path("search/", views.search_users, name="search-users"),
    path("follow-requests/", views.follow_requests, name="follow-requests"),
    path(
        "follow-requests/<uuid:follow_id>/accept/",
        views.accept_follow_request,
        name="accept-follow-request",
    ),
    path(
        "follow-requests/<uuid:follow_id>/reject/",
        views.reject_follow_request,
        name="reject-follow-request",
    ),
    path(
        "profile/<str:username>/followers/", views.get_followers, name="get-followers"
    ),
    path(
        "profile/<str:username>/following/", views.get_following, name="get-following"
    ),
    path("settings/", views.user_settings, name="user-settings"),
    path("timezones/", views.timezone_list, name="timezone-list"),
    path("location/ip/", views.get_ip_location, name="get-ip-location"),
    path("delete-account/", views.delete_account, name="delete-account"),
    path("password-reset/", views.request_password_reset, name="request-password-reset"),
    path("password-reset/confirm/", views.confirm_password_reset, name="confirm-password-reset"),
    path("change-password/", views.change_password, name="change-password"),
]
