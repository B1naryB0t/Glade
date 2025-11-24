# backend/oauth_app/urls.py
from django.urls import path
from . import views

app_name = 'oauth_app'

urlpatterns = [
    path('apps/', views.list_oauth_apps, name='list_apps'),
    path('apps/register/', views.register_oauth_app, name='register_app'),
    path('apps/<int:app_id>/', views.delete_oauth_app, name='delete_app'),
]
