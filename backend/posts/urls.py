# backend/posts/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("", views.PostListCreateView.as_view(), name="post-list-create"),
    path("local/", views.LocalPostsView.as_view(), name="local-posts"),
    path("user/<str:username>/", views.UserPostsView.as_view(), name="user-posts"),
    path("<uuid:post_id>/like/", views.like_post, name="like-post"),
    path("<uuid:post_id>/comments/", views.post_comments, name="post-comments"),
    path("upload-image/", views.upload_post_image, name="upload-post-image"),
]
