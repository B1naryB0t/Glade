## Database Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_user_username ON accounts_user (username);
CREATE INDEX idx_user_email ON accounts_user (email);
CREATE INDEX idx_user_actor_uri ON accounts_user (actor_uri);

-- Spatial queries
CREATE INDEX idx_user_location ON accounts_user USING GIST (approximate_location);
CREATE INDEX idx_post_location ON posts_post USING GIST (location);

-- Timeline queries
CREATE INDEX idx_post_created_desc ON posts_post (created_at DESC);
CREATE INDEX idx_post_author_created ON posts_post (author_id, created_at DESC);

-- Follow relationships
CREATE INDEX idx_follow_follower ON accounts_follow (follower_id, created_at DESC);
CREATE INDEX idx_follow_following ON accounts_follow (following_id, created_at DESC);

-- Notification queries
CREATE INDEX idx_notification_recipient ON notifications_notification (recipient_id, created_at DESC);
CREATE INDEX idx_notification_unread ON notifications_notification (recipient_id, read);

-- Security lookups
CREATE INDEX idx_login_attempt_composite ON accounts_loginattempt (username, ip_address, created_at DESC);
CREATE INDEX idx_security_event_user ON accounts_securityevent (user_id, created_at DESC);

-- Federation lookups
CREATE INDEX idx_activity_type_date ON federation_activity (activity_type, created_at DESC);
CREATE INDEX idx_remote_user_actor ON federation_remoteuser (actor_uri);
```

---

## Field Constraints
