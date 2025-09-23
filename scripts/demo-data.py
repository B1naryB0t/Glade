#!/usr/bin/env python
"""
Create demo data for Glade presentation
"""
from posts.models import Post
from django.contrib.gis.geos import Point
from accounts.models import Follow, User
import os
import sys

import django

# Setup Django
sys.path.append("backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "glade.settings.development")
django.setup()


def create_demo_data():
    print("Creating demo data...")

    # Create users
    users = []
    user_data = [
        ("alice", "Alice Cooper", "alice@example.com", "Local community organizer"),
        ("bob", "Bob Builder", "bob@example.com", "Neighborhood watch coordinator"),
        ("carol", "Carol Singer", "carol@example.com", "Local business owner"),
    ]

    for username, display_name, email, bio in user_data:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "display_name": display_name,
                "bio": bio,
                # Charlotte, NC
                "approximate_location": Point(-80.8431, 35.2271),
            },
        )
        if created:
            user.set_password("demo123")
            user.save()
            print(f"Created user: {username}")
        users.append(user)

    # Create follows
    Follow.objects.get_or_create(
        follower=users[1], following=users[0], defaults={"accepted": True}
    )
    Follow.objects.get_or_create(
        follower=users[2], following=users[0], defaults={"accepted": True}
    )

    # Create posts
    posts_data = [
        (
            users[0],
            "Welcome to our local Glade community! Let's connect with our neighbors.",
            2,
            Point(-80.8431, 35.2271),
        ),
        (
            users[1],
            "Community cleanup this Saturday at Freedom Park. Who's in?",
            2,
            Point(-80.8405, 35.1987),
        ),
        (
            users[2],
            "New coffee shop opening on Main Street! Stop by for grand opening special",
            2,
            Point(-80.8445, 35.2301),
        ),
        (
            users[0],
            "Beautiful sunset from uptown tonight. Hope everyone had a great day!",
            1,
            None,
        ),
    ]

    for author, content, visibility, location in posts_data:
        post, created = Post.objects.get_or_create(
            author=author,
            content=content,
            defaults={
                "visibility": visibility,
                "location": location,
                "location_radius": 1000,
            },
        )
        if created:
            print(f"Created post by {author.username}")

    print("Demo data created successfully!")
    print("\nDemo users (password: demo123):")
    for username, display_name, _, _ in user_data:
        print(f"  {username} - {display_name}")


if __name__ == "__main__":
    create_demo_data()
