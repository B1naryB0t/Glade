# backend/posts/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("", views.PostListCreateView.as_view(), name="post-list-create"),
    path("local/", views.LocalPostsView.as_view(), name="local-posts"),
    path("<uuid:post_id>/like/", views.like_post, name="like-post"),
    path("upload-image/", views.upload_post_image, name="upload-post-image"),
]
