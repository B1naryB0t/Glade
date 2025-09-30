# backend/glade/urls.py (MAIN URL CONFIG)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/posts/", include("posts.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("", include("federation.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
