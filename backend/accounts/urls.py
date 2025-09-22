from django.urls import path

from .views import RegisterView, UserProfileView, follow_user, login_view

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", login_view, name="login"),
    path("profile/<str:username>/", UserProfileView.as_view(), name="user-profile"),
    path("follow/<str:username>/", follow_user, name="follow-user"),
]
