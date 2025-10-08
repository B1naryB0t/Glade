## Asynchronous Task Processing

### Celery Configuration

**Broker**: Redis  
**Result Backend**: Redis  
**Serializer**: JSON  
**Task Routing**: Default queue

#### Task Definitions

##### `federate_post(post_id: str, activity_type: str = "Create")`

**Queue**: default  
**Rate Limit**: None  
**Retry**: 3 attempts with exponential backoff  
**Behavior**:

1. Fetch post from database
2. Validate federation eligibility (not local_only, author federation_enabled)
3. Serialize post to ActivityPub Note
4. Create ActivityPub Create activity
5. Determine target inboxes
6. Send HTTP POST to each inbox with signed request
7. Log activity to Activity model

##### `send_notification_email(notification_id: str)`

**Queue**: default  
**Rate Limit**: None  
**Retry**: 2 attempts  
**Behavior**:

1. Fetch notification from database
2. Check if already emailed
3. Check recipient email_verified
4. Render email template
5. Send via SMTP
6. Mark notification as emailed

##### `cleanup_old_notifications()`

**Schedule**: Daily at 02:00  
**Behavior**:

- Delete Notification records where `read=True` and `created_at < 30 days ago`
- Log deletion count

##### `cleanup_old_login_attempts()`

**Schedule**: Daily at 02:30  
**Behavior**:

- Delete LoginAttempt records where `created_at < 30 days ago`
- Log deletion count

#### Celery Beat Schedule

```python
CELERY_BEAT_SCHEDULE = {
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=2, minute=0),
    },
    'cleanup-old-login-attempts': {
        'task': 'notifications.tasks.cleanup_old_login_attempts',
        'schedule': crontab(hour=2, minute=30),
    },
}
```

---

## API Response Codes
