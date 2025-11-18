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
    path("profile/<str:username>/avatar/", views.upload_avatar, name="upload-avatar"),
    path("follow/<str:username>/", views.follow_user, name="follow-user"),
    path("search/", views.search_users, name="search-users"),
]
