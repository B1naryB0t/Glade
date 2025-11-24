# backend/federation/serializers.py
from rest_framework import serializers
from .models import RemotePost, RemoteUser


class RemoteUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemoteUser
        fields = ['id', 'username', 'display_name', 'avatar_url', 'actor_uri']


class RemotePostSerializer(serializers.ModelSerializer):
    author = RemoteUserSerializer(source='remote_user', read_only=True)
    
    class Meta:
        model = RemotePost
        fields = ['id', 'activity_id', 'content', 'published', 'summary', 'author']
