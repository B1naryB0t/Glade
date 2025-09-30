# backend/notifications/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notification-list"),
    path(
        "unread/",
        views.UnreadNotificationListView.as_view(),
        name="notification-unread",
    ),
    path("count/", views.notification_count, name="notification-count"),
    path(
        "<uuid:notification_id>/read/", views.mark_notification_read, name="mark-read"
    ),
    path("mark-all-read/", views.mark_all_notifications_read, name="mark-all-read"),
    path(
        "preferences/",
        views.NotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
]
