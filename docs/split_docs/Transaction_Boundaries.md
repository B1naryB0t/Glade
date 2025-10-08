## Transaction Boundaries

### Critical Operations Requiring Atomicity

#### User Registration

```python
with transaction.atomic():
    # Create user
    user = User.objects.create_user(...)
    # Create auth token
    Token.objects.create(user=user)
    # Create notification preferences
    NotificationPreference.objects.create(user=user)
    # Send verification email (non-blocking)
```

#### Post Creation with Federation

```python
with transaction.atomic():
    # Create post
    post = Post.objects.create(...)
    # Queue federation task
    if not post.local_only:
        federate_post.delay(str(post.id))
```

#### Follow Request Processing

```python
with transaction.atomic():
    # Create or update follow
    follow, created = Follow.objects.get_or_create(...)
    # Create notification
    if created:
        Notification.objects.create(...)
    # Queue federation activity
    if target_user.is_remote:
        send_follow_activity.delay(...)
```

---

## Security Considerations
