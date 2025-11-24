# backend/posts/urls.py
from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.PostListCreateView.as_view(), name="post-list-create"),
    path("local/", views.LocalPostsView.as_view(), name="local-posts"),
    path("user/<str:username>/", views.UserPostsView.as_view(), name="user-posts"),
    path("<uuid:post_id>/like/", views.like_post, name="like-post"),
    path("<uuid:post_id>/comments/", views.post_comments, name="post-comments"),
    path("<uuid:post_id>/delete/", views.delete_post, name="delete-post"),
    path("comments/<uuid:comment_id>/delete/", views.delete_comment, name="delete-comment"),
    path("upload-image/", views.upload_post_image, name="upload-post-image"),
    path("", include("federation.urls")),
]
