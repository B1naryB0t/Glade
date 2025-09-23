from django.urls import path

from views import LocalPostsView, PostListCreateView, like_post

urlpatterns = [
    path("", PostListCreateView.as_view(), name="post-list-create"),
    path("local/", LocalPostsView.as_view(), name="local-posts"),
    path("<uuid:post_id>/like/", like_post, name="like-post"),
]
