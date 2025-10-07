# Glade Data Model Documentation

## Table of Contents

1. [User Models](#user-models)
2. [Admin Models](#admin-models)
3. [Post Models](#post-models)
4. [Notification Models](#notification-models)
5. [Federation Models](#federation-models)
6. [Database Indexes](#database-indexes)
7. [Field Constraints](#field-constraints)

---

## User Models

### User Model

**Table**: `accounts_user`  
**Inherits**: `AbstractUser` (Django)  
**Database Engine**: PostgreSQL with PostGIS

#### Field Definitions

| Field                     | Type         | Constraints                          | Description                                         |
| ------------------------- | ------------ | ------------------------------------ | --------------------------------------------------- |
| `id`                      | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4 | Universally unique identifier for user              |
| `username`                | VARCHAR(150) | UNIQUE, NOT NULL, INDEXED            | Unique username, max 50 chars enforced at app level |
| `email`                   | VARCHAR(254) | UNIQUE, NOT NULL                     | User email address                                  |
| `email_verified`          | BOOLEAN      | DEFAULT FALSE                        | Email verification status                           |
| `password`                | VARCHAR(128) | NOT NULL                             | Hashed password using Django's PBKDF2 algorithm     |
| `display_name`            | VARCHAR(100) | NULL, BLANK                          | Public display name                                 |
| `bio`                     | TEXT         | NULL, BLANK, MAX 500 chars           | User biography                                      |
| `avatar`                  | VARCHAR(100) | NULL, BLANK                          | File path to avatar image in media storage          |
| `privacy_level`           | INTEGER      | NOT NULL, DEFAULT 2                  | Privacy setting: 1=Public, 2=Local, 3=Private       |
| `location_privacy_radius` | INTEGER      | NOT NULL, DEFAULT 1000               | Location fuzzing radius in meters                   |
| `approximate_location`    | POINT        | NULL, BLANK, SRID 4326               | PostGIS point geometry for user location            |
| `federation_enabled`      | BOOLEAN      | DEFAULT TRUE                         | Whether user participates in ActivityPub federation |
| `actor_uri`               | VARCHAR(200) | NULL, BLANK                          | ActivityPub actor URI                               |
| `public_key`              | TEXT         | NULL, BLANK                          | RSA public key (PEM format, 2048-bit)               |
| `private_key`             | TEXT         | NULL, BLANK                          | RSA private key (PEM format, 2048-bit, unencrypted) |
| `last_password_change`    | TIMESTAMP    | NOT NULL, DEFAULT now()              | Timestamp of last password modification             |
| `require_password_change` | BOOLEAN      | DEFAULT FALSE                        | Force password reset on next login                  |
| `created_at`              | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD               | Account creation timestamp                          |
| `updated_at`              | TIMESTAMP    | NOT NULL, AUTO_NOW                   | Last modification timestamp                         |
| `last_active_at`          | TIMESTAMP    | NOT NULL, DEFAULT now()              | Last activity timestamp                             |
| `is_active`               | BOOLEAN      | DEFAULT TRUE                         | Account active status (inherited from AbstractUser) |
| `is_staff`                | BOOLEAN      | DEFAULT FALSE                        | Staff status (inherited from AbstractUser)          |
| `is_superuser`            | BOOLEAN      | DEFAULT FALSE                        | Superuser status (inherited from AbstractUser)      |
| `first_name`              | VARCHAR(150) | NULL, BLANK                          | Optional first name (inherited from AbstractUser)   |
| `last_name`               | VARCHAR(150) | NULL, BLANK                          | Optional last name (inherited from AbstractUser)    |
| `date_joined`             | TIMESTAMP    | NOT NULL                             | Registration date (inherited from AbstractUser)     |

#### Computed Properties

- **`avatar_url`**: Returns avatar URL if exists, otherwise generates UI Avatars URL
- **Privacy Choices Enum**:
  - `1`: Public - visible to all federated instances
  - `2`: Local - visible to local instance and nearby users
  - `3`: Private - visible only to accepted followers

#### Methods

##### `save()`

**Behavior**: Overridden to perform pre-save operations

- Generates RSA keypair if not present (2048-bit, public exponent 65537)
- Sets `actor_uri` to `https://{INSTANCE_DOMAIN}/users/{username}`
- Sanitizes `display_name` and `bio` fields using InputValidationService

##### `_generate_keypair()`

**Return**: None (sets `public_key` and `private_key`)
**Behavior**:

- Generates RSA private key (2048-bit)
- Serializes private key as PEM PKCS8 format (unencrypted)
- Derives public key from private key
- Serializes public key as PEM SubjectPublicKeyInfo format

##### `to_activitypub_actor()`

**Return**: `dict`
**Schema**: ActivityStreams 2.0 Person object

```python
{
    "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
    "type": "Person",
    "id": str,                          # Actor URI
    "preferredUsername": str,           # Username
    "name": str,                        # Display name or username
    "summary": str,                     # Bio
    "inbox": str,                       # Inbox endpoint URL
    "outbox": str,                      # Outbox endpoint URL
    "followers": str,                   # Followers collection URL
    "following": str,                   # Following collection URL
    "publicKey": {
        "id": str,                      # Public key ID
        "owner": str,                   # Actor URI
        "publicKeyPem": str             # PEM-encoded public key
    },
    "endpoints": {
        "sharedInbox": str              # Shared inbox URL
    },
    "glade:location": {                 # Custom extension, optional
        "type": "Place",
        "glade:privacyRadius": int,
        "glade:approximateLocation": bool
    }
}
```

#### Relationships

- **`posts`**: One-to-Many relationship to Post model (related_name: `posts`)
- **`following`**: Many-to-Many through Follow model (as follower)
- **`followers`**: Many-to-Many through Follow model (as following)
- **`notifications`**: One-to-Many to Notification model (related_name: `notifications`)
- **`notification_preferences`**: One-to-One to NotificationPreference model

#### Indexes

```sql
CREATE INDEX ON accounts_user (username);
CREATE INDEX ON accounts_user (email);
CREATE INDEX ON accounts_user (actor_uri);
CREATE INDEX ON accounts_user (created_at);
CREATE SPATIAL INDEX ON accounts_user USING GIST (approximate_location);
```

---

### Follow Model

**Table**: `accounts_follow`

#### Field Definitions

| Field          | Type         | Constraints                                                | Description                           |
| -------------- | ------------ | ---------------------------------------------------------- | ------------------------------------- |
| `id`           | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Unique follow relationship identifier |
| `follower_id`  | UUID         | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | User initiating follow                |
| `following_id` | UUID         | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | User being followed                   |
| `activity_id`  | VARCHAR(200) | NULL, BLANK                                                | ActivityPub Follow activity ID        |
| `accepted`     | BOOLEAN      | DEFAULT FALSE                                              | Whether follow request accepted       |
| `created_at`   | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                     | Follow request timestamp              |

#### Constraints

```sql
UNIQUE CONSTRAINT (follower_id, following_id)
```

#### Methods

##### `to_activitypub_follow()`

**Return**: `dict`
**Schema**: ActivityStreams 2.0 Follow activity

```python
{
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Follow",
    "id": str,          # Activity ID
    "actor": str,       # Follower actor URI
    "object": str       # Following actor URI
}
```

#### Indexes

```sql
CREATE INDEX ON accounts_follow (follower_id, created_at);
CREATE INDEX ON accounts_follow (following_id, created_at);
CREATE INDEX ON accounts_follow (accepted);
CREATE UNIQUE INDEX ON accounts_follow (follower_id, following_id);
```

---

### EmailVerificationToken Model

**Table**: `accounts_emailverificationtoken`

#### Field Definitions

| Field        | Type         | Constraints                                                | Description                      |
| ------------ | ------------ | ---------------------------------------------------------- | -------------------------------- |
| `id`         | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Token identifier                 |
| `user_id`    | UUID         | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | Associated user                  |
| `token`      | VARCHAR(255) | UNIQUE, NOT NULL                                           | URL-safe token string (32 bytes) |
| `expires_at` | TIMESTAMP    | NOT NULL                                                   | Token expiration timestamp       |
| `used`       | BOOLEAN      | DEFAULT FALSE                                              | Whether token has been consumed  |
| `created_at` | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                     | Token creation timestamp         |

#### Methods

##### `is_valid()`

**Return**: `bool`
**Logic**: `not self.used and self.expires_at > timezone.now()`

#### Indexes

```sql
CREATE INDEX ON accounts_emailverificationtoken (token);
CREATE INDEX ON accounts_emailverificationtoken (user_id, created_at DESC);
CREATE INDEX ON accounts_emailverificationtoken (expires_at);
```

---

### LoginAttempt Model

**Table**: `accounts_loginattempt`

#### Field Definitions

| Field        | Type         | Constraints                                             | Description               |
| ------------ | ------------ | ------------------------------------------------------- | ------------------------- |
| `id`         | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                    | Attempt identifier        |
| `user_id`    | UUID         | FOREIGN KEY(accounts_user.id), NULL, ON DELETE SET_NULL | Associated user if exists |
| `username`   | VARCHAR(150) | NOT NULL                                                | Attempted username        |
| `ip_address` | INET         | NOT NULL                                                | Client IP address         |
| `user_agent` | VARCHAR(255) | NULL, BLANK                                             | Browser user agent string |
| `success`    | BOOLEAN      | DEFAULT FALSE                                           | Whether login succeeded   |
| `created_at` | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                  | Attempt timestamp         |

#### Indexes

```sql
CREATE INDEX ON accounts_loginattempt (username, ip_address, created_at DESC);
CREATE INDEX ON accounts_loginattempt (ip_address, created_at DESC);
CREATE INDEX ON accounts_loginattempt (created_at DESC);
```

#### Usage

Used for brute force detection. Service checks for 5+ failed attempts within 15 minutes from same IP/username combination.

---

### SecurityEvent Model

**Table**: `accounts_securityevent`

#### Field Definitions

| Field        | Type        | Constraints                                                | Description                          |
| ------------ | ----------- | ---------------------------------------------------------- | ------------------------------------ |
| `id`         | UUID        | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Event identifier                     |
| `user_id`    | UUID        | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | Associated user                      |
| `event_type` | VARCHAR(50) | NOT NULL                                                   | Type of security event (see choices) |
| `details`    | TEXT        | NOT NULL                                                   | Event description                    |
| `ip_address` | INET        | NULL, BLANK                                                | Client IP if applicable              |
| `created_at` | TIMESTAMP   | NOT NULL, AUTO_NOW_ADD                                     | Event timestamp                      |

#### Event Type Choices

```python
EVENT_TYPES = [
    ('password_change', 'Password Change'),
    ('email_change', 'Email Change'),
    ('ip_change', 'IP Address Change'),
    ('suspicious_activity', 'Suspicious Activity'),
    ('account_locked', 'Account Locked'),
    ('account_unlocked', 'Account Unlocked'),
]
```

#### Indexes

```sql
CREATE INDEX ON accounts_securityevent (user_id, created_at DESC);
CREATE INDEX ON accounts_securityevent (event_type, created_at DESC);
```

---

## Admin Models

### Django Admin Configuration

#### CustomUserAdmin

**Registered Model**: `User`

**List Display Fields**:

- `username`
- `email`
- `display_name`
- `privacy_level`
- `federation_enabled`
- `created_at`

**List Filters**:

- `privacy_level`
- `federation_enabled`
- `created_at`

**Fieldsets**:

```python
fieldsets = UserAdmin.fieldsets + (
    ('Profile', {
        'fields': ('display_name', 'bio', 'avatar')
    }),
    ('Privacy', {
        'fields': ('privacy_level', 'location_privacy_radius', 'approximate_location')
    }),
    ('Federation', {
        'fields': ('federation_enabled', 'actor_uri')
    }),
)
```

#### FollowAdmin

**Registered Model**: `Follow`

**List Display Fields**:

- `follower`
- `following`
- `accepted`
- `created_at`

**List Filters**:

- `accepted`
- `created_at`

---

## Post Models

### Post Model

**Table**: `posts_post`

#### Field Definitions

| Field             | Type         | Constraints                                                | Description                                 |
| ----------------- | ------------ | ---------------------------------------------------------- | ------------------------------------------- |
| `id`              | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Post identifier                             |
| `author_id`       | UUID         | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | Post author                                 |
| `content`         | TEXT         | NOT NULL, MAX 5000 chars                                   | Post content (sanitized plain text)         |
| `content_warning` | VARCHAR(200) | NULL, BLANK                                                | Content warning text                        |
| `visibility`      | INTEGER      | NOT NULL, DEFAULT 2                                        | Visibility level (see choices)              |
| `location`        | POINT        | NULL, BLANK, SRID 4326                                     | PostGIS point geometry (fuzzed)             |
| `location_radius` | INTEGER      | NULL, BLANK                                                | Visibility radius in meters                 |
| `local_only`      | BOOLEAN      | DEFAULT FALSE                                              | Prevent federation of this post             |
| `activity_id`     | VARCHAR(200) | UNIQUE, NULL, BLANK                                        | ActivityPub object ID                       |
| `federated_id`    | VARCHAR(200) | NULL, BLANK                                                | Original object ID if federated from remote |
| `reply_to_id`     | UUID         | FOREIGN KEY(posts_post.id), NULL, ON DELETE CASCADE        | Parent post if reply                        |
| `created_at`      | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                     | Post creation timestamp                     |
| `updated_at`      | TIMESTAMP    | NOT NULL, AUTO_NOW                                         | Last edit timestamp                         |

#### Visibility Choices

```python
VISIBILITY_CHOICES = [
    (1, "Public"),      # Federated to all instances
    (2, "Local"),       # Local instance + nearby users
    (3, "Followers"),   # Followers only
    (4, "Private"),     # Author only (drafts)
]
```

#### Methods

##### `save()`

**Behavior**: Overridden to set `activity_id` if not present

```python
if not self.activity_id:
    self.activity_id = f"https://{settings.INSTANCE_DOMAIN}/posts/{self.id}"
```

##### `to_activitypub_note()`

**Return**: `dict`
**Schema**: ActivityStreams 2.0 Note object

```python
{
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Note",
    "id": str,                          # Activity ID
    "published": str,                   # ISO 8601 timestamp
    "attributedTo": str,                # Author actor URI
    "content": str,                     # Post content
    "contentMap": {"en": str},          # Localized content
    "to": list[str],                    # Primary recipients
    "cc": list[str],                    # Carbon copy recipients
    "sensitive": bool,                  # Content warning present
    "summary": str | None,              # Content warning text
    "inReplyTo": str | None,            # Parent post activity ID
    "glade:location": {
        "type": "Place",
        "glade:approximate": bool,
        "glade:radius": int
    }
}
```

##### `_get_to_field()`

**Return**: `list[str]`
**Logic**:

- Visibility 1 (Public): `["https://www.w3.org/ns/activitystreams#Public"]`
- Visibility 3 (Followers): `["{author.actor_uri}/followers"]`
- Other: `[]`

##### `_get_cc_field()`

**Return**: `list[str]`
**Logic**:

- Visibility 1 (Public): `["{author.actor_uri}/followers"]`
- Visibility 2 (Local): `["https://{INSTANCE_DOMAIN}/users/{username}/followers"]`
- Other: `[]`

#### Relationships

- **`author`**: Many-to-One to User model
- **`reply_to`**: Self-referencing Foreign Key
- **`replies`**: One-to-Many (related_name: `replies`)
- **`likes`**: One-to-Many to Like model
- **`notifications`**: One-to-Many to Notification model

#### Indexes

```sql
CREATE INDEX ON posts_post (created_at DESC);
CREATE INDEX ON posts_post (author_id, created_at DESC);
CREATE INDEX ON posts_post (visibility);
CREATE INDEX ON posts_post (activity_id);
CREATE SPATIAL INDEX ON posts_post USING GIST (location);
```

#### Meta Options

```python
ordering = ['-created_at']
```

---

### Like Model

**Table**: `posts_like`

#### Field Definitions

| Field         | Type         | Constraints                                                | Description                  |
| ------------- | ------------ | ---------------------------------------------------------- | ---------------------------- |
| `id`          | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Like identifier              |
| `user_id`     | UUID         | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | User who liked               |
| `post_id`     | UUID         | FOREIGN KEY(posts_post.id), NOT NULL, ON DELETE CASCADE    | Liked post                   |
| `activity_id` | VARCHAR(200) | NULL, BLANK                                                | ActivityPub Like activity ID |
| `created_at`  | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                     | Like timestamp               |

#### Constraints

```sql
UNIQUE CONSTRAINT (user_id, post_id)
```

#### Methods

##### `to_activitypub_like()`

**Return**: `dict`
**Schema**: ActivityStreams 2.0 Like activity

```python
{
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Like",
    "id": str,          # Activity ID
    "actor": str,       # User actor URI
    "object": str       # Post activity ID
}
```

#### Indexes

```sql
CREATE INDEX ON posts_like (post_id, created_at DESC);
CREATE INDEX ON posts_like (user_id, created_at DESC);
CREATE UNIQUE INDEX ON posts_like (user_id, post_id);
```

---

## Notification Models

### NotificationPreference Model

**Table**: `notifications_notificationpreference`

#### Field Definitions

| Field                       | Type      | Constraints                                                        | Description                              |
| --------------------------- | --------- | ------------------------------------------------------------------ | ---------------------------------------- |
| `id`                        | BIGINT    | PRIMARY KEY, AUTO_INCREMENT                                        | Preference record ID                     |
| `user_id`                   | UUID      | FOREIGN KEY(accounts_user.id), UNIQUE, NOT NULL, ON DELETE CASCADE | Associated user                          |
| `notify_on_likes`           | BOOLEAN   | DEFAULT TRUE                                                       | In-app notifications for likes           |
| `notify_on_replies`         | BOOLEAN   | DEFAULT TRUE                                                       | In-app notifications for replies         |
| `notify_on_mentions`        | BOOLEAN   | DEFAULT TRUE                                                       | In-app notifications for mentions        |
| `notify_on_follows`         | BOOLEAN   | DEFAULT TRUE                                                       | In-app notifications for follows         |
| `notify_on_follow_requests` | BOOLEAN   | DEFAULT TRUE                                                       | In-app notifications for follow requests |
| `email_on_likes`            | BOOLEAN   | DEFAULT FALSE                                                      | Email notifications for likes            |
| `email_on_replies`          | BOOLEAN   | DEFAULT TRUE                                                       | Email notifications for replies          |
| `email_on_mentions`         | BOOLEAN   | DEFAULT TRUE                                                       | Email notifications for mentions         |
| `email_on_follows`          | BOOLEAN   | DEFAULT TRUE                                                       | Email notifications for follows          |
| `created_at`                | TIMESTAMP | NOT NULL, AUTO_NOW_ADD                                             | Preference creation timestamp            |
| `updated_at`                | TIMESTAMP | NOT NULL, AUTO_NOW                                                 | Last modification timestamp              |

#### Relationships

- **`user`**: One-to-One with User model (related_name: `notification_preferences`)

---

### Notification Model

**Table**: `notifications_notification`

#### Field Definitions

| Field               | Type        | Constraints                                                | Description                        |
| ------------------- | ----------- | ---------------------------------------------------------- | ---------------------------------- |
| `id`                | UUID        | PRIMARY KEY, NOT NULL, DEFAULT uuid4                       | Notification identifier            |
| `recipient_id`      | UUID        | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | User receiving notification        |
| `actor_id`          | UUID        | FOREIGN KEY(accounts_user.id), NOT NULL, ON DELETE CASCADE | User who triggered notification    |
| `notification_type` | VARCHAR(20) | NOT NULL                                                   | Type of notification (see choices) |
| `post_id`           | UUID        | FOREIGN KEY(posts_post.id), NULL, ON DELETE CASCADE        | Related post if applicable         |
| `message`           | TEXT        | NOT NULL                                                   | Notification message text          |
| `read`              | BOOLEAN     | DEFAULT FALSE                                              | Whether notification has been read |
| `emailed`           | BOOLEAN     | DEFAULT FALSE                                              | Whether email notification sent    |
| `created_at`        | TIMESTAMP   | NOT NULL, AUTO_NOW_ADD                                     | Notification creation timestamp    |

#### Notification Type Choices

```python
NOTIFICATION_TYPES = [
    ('like', 'Like'),
    ('reply', 'Reply'),
    ('mention', 'Mention'),
    ('follow', 'Follow'),
    ('follow_request', 'Follow Request'),
    ('follow_accepted', 'Follow Accepted'),
]
```

#### Methods

##### `mark_as_read()`

**Behavior**: Sets `read = True` and saves

#### Relationships

- **`recipient`**: Many-to-One to User model (related_name: `notifications`)
- **`actor`**: Many-to-One to User model (related_name: `actions`)
- **`post`**: Many-to-One to Post model (related_name: `notifications`)

#### Indexes

```sql
CREATE INDEX ON notifications_notification (recipient_id, created_at DESC);
CREATE INDEX ON notifications_notification (recipient_id, read);
CREATE INDEX ON notifications_notification (created_at DESC);
```

#### Meta Options

```python
ordering = ['-created_at']
```

---

## Federation Models

### RemoteInstance Model

**Table**: `federation_remoteinstance`

#### Field Definitions

| Field          | Type         | Constraints                          | Description                              |
| -------------- | ------------ | ------------------------------------ | ---------------------------------------- |
| `id`           | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4 | Instance identifier                      |
| `domain`       | VARCHAR(255) | UNIQUE, NOT NULL                     | Instance domain name                     |
| `software`     | VARCHAR(50)  | NULL, BLANK                          | Software type (mastodon, pleroma, glade) |
| `version`      | VARCHAR(20)  | NULL, BLANK                          | Software version                         |
| `trust_level`  | INTEGER      | DEFAULT 1                            | Trust level (see choices)                |
| `shared_inbox` | VARCHAR(200) | NULL, BLANK                          | Shared inbox URL                         |
| `public_key`   | TEXT         | NULL, BLANK                          | Instance public key                      |
| `user_count`   | INTEGER      | DEFAULT 0                            | Cached user count                        |
| `post_count`   | INTEGER      | DEFAULT 0                            | Cached post count                        |
| `last_seen_at` | TIMESTAMP    | NULL, BLANK                          | Last federation activity                 |
| `created_at`   | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD               | Instance discovery timestamp             |

#### Trust Level Choices

```python
TRUST_LEVELS = [
    (0, "Blocked"),     # No federation
    (1, "Limited"),     # Limited federation
    (2, "Trusted"),     # Full federation
]
```

#### Indexes

```sql
CREATE INDEX ON federation_remoteinstance (domain);
CREATE INDEX ON federation_remoteinstance (trust_level);
```

#### Meta Options

```python
ordering = ['domain']
```

---

### RemoteUser Model

**Table**: `federation_remoteuser`

#### Field Definitions

| Field             | Type         | Constraints                                                            | Description                    |
| ----------------- | ------------ | ---------------------------------------------------------------------- | ------------------------------ |
| `id`              | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4                                   | Remote user cache identifier   |
| `instance_id`     | UUID         | FOREIGN KEY(federation_remoteinstance.id), NOT NULL, ON DELETE CASCADE | Source instance                |
| `actor_uri`       | VARCHAR(200) | UNIQUE, NOT NULL                                                       | ActivityPub actor URI          |
| `username`        | VARCHAR(50)  | NOT NULL                                                               | Remote username                |
| `display_name`    | VARCHAR(100) | NULL, BLANK                                                            | Remote display name            |
| `summary`         | TEXT         | NULL, BLANK                                                            | Remote bio                     |
| `avatar_url`      | VARCHAR(200) | NULL, BLANK                                                            | Remote avatar URL              |
| `inbox_url`       | VARCHAR(200) | NOT NULL                                                               | Remote inbox endpoint          |
| `outbox_url`      | VARCHAR(200) | NULL, BLANK                                                            | Remote outbox endpoint         |
| `public_key`      | TEXT         | NOT NULL                                                               | Remote public key (PEM format) |
| `last_fetched_at` | TIMESTAMP    | NOT NULL, AUTO_NOW                                                     | Last cache update timestamp    |
| `created_at`      | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD                                                 | Cache creation timestamp       |

#### Constraints

```sql
UNIQUE CONSTRAINT (instance_id, username)
```

#### Relationships

- **`instance`**: Many-to-One to RemoteInstance model

#### Indexes

```sql
CREATE INDEX ON federation_remoteuser (actor_uri);
CREATE INDEX ON federation_remoteuser (instance_id, username);
CREATE UNIQUE INDEX ON federation_remoteuser (actor_uri);
```

---

### Activity Model

**Table**: `federation_activity`

#### Field Definitions

| Field           | Type         | Constraints                          | Description                                 |
| --------------- | ------------ | ------------------------------------ | ------------------------------------------- |
| `id`            | UUID         | PRIMARY KEY, NOT NULL, DEFAULT uuid4 | Activity log identifier                     |
| `activity_id`   | VARCHAR(200) | UNIQUE, NOT NULL                     | ActivityPub activity ID                     |
| `activity_type` | VARCHAR(20)  | NOT NULL                             | Type of activity (see choices)              |
| `direction`     | VARCHAR(10)  | NOT NULL                             | Direction (inbound/outbound)                |
| `actor_uri`     | VARCHAR(200) | NOT NULL                             | Actor URI                                   |
| `object_uri`    | VARCHAR(200) | NULL, BLANK                          | Object URI                                  |
| `raw_activity`  | JSONB        | NOT NULL                             | Full ActivityPub activity JSON              |
| `processed`     | BOOLEAN      | DEFAULT FALSE                        | Whether activity was processed successfully |
| `error_message` | TEXT         | NULL, BLANK                          | Error details if processing failed          |
| `created_at`    | TIMESTAMP    | NOT NULL, AUTO_NOW_ADD               | Activity reception/send timestamp           |

#### Activity Type Choices

```python
ACTIVITY_TYPES = [
    ('Create', 'Create'),
    ('Update', 'Update'),
    ('Delete', 'Delete'),
    ('Follow', 'Follow'),
    ('Accept', 'Accept'),
    ('Reject', 'Reject'),
    ('Like', 'Like'),
    ('Undo', 'Undo'),
]
```

#### Direction Choices

```python
DIRECTIONS = [
    ('inbound', 'Inbound'),     # Received from remote
    ('outbound', 'Outbound'),   # Sent to remote
]
```

#### Indexes

```sql
CREATE INDEX ON federation_activity (activity_id);
CREATE INDEX ON federation_activity (activity_type, created_at DESC);
CREATE INDEX ON federation_activity (direction, created_at DESC);
CREATE INDEX ON federation_activity (actor_uri, created_at DESC);
CREATE INDEX ON federation_activity (processed);
```

#### Meta Options

```python
ordering = ['-created_at']
```

---

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

### String Length Limits

```python
# User fields
MAX_USERNAME_LENGTH = 50
MAX_DISPLAY_NAME_LENGTH = 100
MAX_BIO_LENGTH = 500

# Post fields
MAX_POST_LENGTH = 5000
MAX_CONTENT_WARNING_LENGTH = 200

# File uploads
MAX_IMAGE_SIZE = 10 * 1024 * 1024      # 10MB
MAX_AVATAR_SIZE = 5 * 1024 * 1024      # 5MB
MAX_IMAGE_DIMENSIONS = (4096, 4096)

# Location
DEFAULT_LOCATION_RADIUS = 1000          # meters
MAX_LOCATION_RADIUS = 50000             # 50km
LOCATION_FUZZING_RADIUS = 100           # ±100m
```

### Validation Rules

#### Username

- Pattern: `^[a-zA-Z0-9_-]+$`
- Must start with alphanumeric character
- Case-insensitive (stored lowercase)
- 1-50 characters

#### Email

- Django EmailValidator
- Unique constraint
- Stored as-is (not hashed in database)

#### Password

- Minimum length enforced by Django validators
- Hashed using PBKDF2-SHA256
- Never stored in plain text

#### Location Coordinates

- Latitude: -90 to 90
- Longitude: -180 to 180
- SRID: 4326 (WGS 84)
- Stored as PostGIS POINT geometry

#### URLs

- ActivityPub URIs: Must be HTTPS in production
- Avatar URLs: Validated as proper URL format
- Maximum length: 200 characters for most URL fields

---

## Data Retention

### Automatic Cleanup

Celery beat tasks run daily at 2:00 AM:

```python
# Cleanup old read notifications (30+ days)
Notification.objects.filter(
    read=True,
    created_at__lt=timezone.now() - timedelta(days=30)
).delete()

# Cleanup old login attempts (30+ days)
LoginAttempt.objects.filter(
    created_at__lt=timezone.now() - timedelta(days=30)
).delete()
```

### Session Management

- Session cookie age: 1,209,600 seconds (14 days)
- Session data stored in database or Redis
- Automatic cleanup of expired sessions by Django

---

## Serialization Schemas

### User Serialization (API Response)

```json
{
  "id": "uuid",
  "username": "string",
  "display_name": "string | null",
  "bio": "string | null",
  "avatar_url": "string",
  "created_at": "ISO 8601 timestamp",
  "followers_count": "integer",
  "following_count": "integer",
  "posts_count": "integer"
}
```

### Post Serialization (API Response)

```json
{
  "id": "uuid",
  "author": {
    "id": "uuid",
    "username": "string",
    "display_name": "string | null",
    "avatar_url": "string"
  },
  "content": "string",
  "content_warning": "string | null",
  "visibility": "integer (1-4)",
  "local_only": "boolean",
  "location_name": "string | null",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "likes_count": "integer",
  "replies_count": "integer",
  "is_liked": "boolean"
}
```

### Notification Serialization (API Response)

```json
{
  "id": "uuid",
  "actor": {
    "id": "uuid",
    "username": "string",
    "display_name": "string | null",
    "avatar_url": "string"
  },
  "notification_type": "string (like|reply|mention|follow|follow_request|follow_accepted)",
  "message": "string",
  "read": "boolean",
  "created_at": "ISO 8601 timestamp",
  "post": "uuid | null"
}
```

---

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

### Password Storage

- Algorithm: PBKDF2-SHA256
- Iterations: 320,000 (Django 4.x default)
- Salt: Automatically generated per password
- Storage format: `pbkdf2_sha256$320000${salt}${hash}`

### Private Key Storage

- **Security Risk**: Private keys stored unencrypted in database
- **Mitigation**: Database-level encryption required in production
- **Future Enhancement**: Consider encrypting private keys with per-user derived key

### Session Security

```python
SESSION_COOKIE_SECURE = True            # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True          # No JavaScript access
SESSION_COOKIE_SAMESITE = 'Lax'         # CSRF protection
SESSION_COOKIE_AGE = 1209600            # 14 days
CSRF_COOKIE_SECURE = True               # HTTPS only in production
CSRF_COOKIE_HTTPONLY = True             # No JavaScript access
```

### Rate Limiting

Implemented via Redis cache:

```python
# Rate limit key format
key = f"rate_limit:{user.id}:{action}"

# Limits (per user)
CREATE_POST: 10 requests per 5 minutes
LIKE_POST: 30 requests per 1 minute
LOGIN_ATTEMPT: 5 attempts per 15 minutes (per IP/username)
```

### Input Sanitization

All user-generated content passes through validation:

```python
# HTML sanitization
bleach.clean(
    text,
    tags=['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
    attributes={'a': ['href', 'title']},
    protocols=['http', 'https'],
    strip=True
)

# Plain text sanitization
bleach.clean(text, tags=[], strip=True)
```

### SQL Injection Prevention

- Django ORM parameterizes all queries
- PostGIS queries use bound parameters
- Raw SQL prohibited in application code

### XSS Prevention

- All template output auto-escaped by Django
- Content Security Policy headers recommended
- User-generated HTML strictly filtered

---

## Privacy Implementation

### Location Fuzzing Algorithm

```python
def apply_location_privacy(lat: float, lng: float, privacy_level: int) -> tuple:
    """
    Apply random offset to coordinates based on privacy level

    Args:
        lat: Original latitude
        lng: Original longitude
        privacy_level: 1=Public(100m), 2=Local(100m), 3=Private(300m)

    Returns:
        (fuzzed_lat, fuzzed_lng)
    """
    max_fuzz = LOCATION_FUZZING_RADIUS * (3 if privacy_level >= 3 else 1)

    # Random polar coordinates
    offset = random.uniform(0, max_fuzz)
    bearing = random.uniform(0, 2 * math.pi)

    # Convert to lat/lng offset (approximate)
    lat_offset = (offset * math.cos(bearing)) / 111320
    lng_offset = (offset * math.sin(bearing)) / (111320 * math.cos(math.radians(lat)))

    return lat + lat_offset, lng + lng_offset
```

### Post Visibility Logic

```python
def can_user_see_post(user: User, post: Post) -> bool:
    """
    Determine if user can view post based on visibility settings

    Rules:
    - Author always sees own posts
    - Public (1): All users
    - Local (2): Users within location_radius
    - Followers (3): Accepted followers only
    - Private (4): Author only
    """
    if post.author == user:
        return True

    if post.visibility == 1:  # Public
        return True
    elif post.visibility == 4:  # Private
        return False
    elif post.visibility == 3:  # Followers
        return Follow.objects.filter(
            follower=user,
            following=post.author,
            accepted=True
        ).exists()
    elif post.visibility == 2:  # Local
        if not user.approximate_location or not post.location:
            return False
        radius = post.location_radius or DEFAULT_LOCATION_RADIUS
        distance = user.approximate_location.distance(post.location)
        return distance <= D(m=radius)

    return False
```

### Email Privacy

- Emails hashed using SHA-256 for some use cases
- Plain email stored for communication (verification, notifications)
- Email never exposed in ActivityPub actor objects
- Email visibility controlled at API serializer level

---

## Performance Optimization

### Database Query Optimization

#### N+1 Query Prevention

```python
# Bad - N+1 queries
posts = Post.objects.all()
for post in posts:
    print(post.author.username)  # Additional query per post

# Good - Single query with join
posts = Post.objects.select_related('author').all()
for post in posts:
    print(post.author.username)  # No additional query

# Multiple relationships
posts = Post.objects.select_related('author').prefetch_related('likes').all()
```

#### Pagination

```python
# REST Framework pagination (settings)
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# Query result
{
    "count": 1000,
    "next": "http://api.example.org/posts/?page=2",
    "previous": null,
    "results": [...]
}
```

#### Index Usage

```sql
-- Ensure queries use indexes
EXPLAIN ANALYZE
SELECT * FROM posts_post
WHERE author_id = '...'
ORDER BY created_at DESC
LIMIT 20;

-- Should show Index Scan on idx_post_author_created
```

### Caching Strategy

#### Remote Actor Caching

```python
# Cache remote ActivityPub actors for 1 hour
cache_key = f"actor:{actor_uri}"
cached = cache.get(cache_key)
if cached:
    return cached

actor_data = fetch_remote_actor(actor_uri)
cache.set(cache_key, actor_data, 3600)
```

#### Rate Limiting Cache

```python
# Redis-based rate limiting
key = f"rate_limit:{user.id}:{action}"
current = cache.get(key, 0)
if current >= limit:
    raise RateLimitExceeded()
cache.set(key, current + 1, window_seconds)
```

#### Session Metadata Cache

```python
# Store session metadata in Redis
cache.set(
    f"session_meta:{session_key}",
    {
        "user_id": str(user.id),
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": timezone.now().isoformat()
    },
    timeout=None  # Expires with session
)
```

---

## Federation Protocols

### ActivityPub Implementation

#### Supported Activity Types

**Outbound** (Sent to remote instances):

- `Create`: New post creation
- `Update`: Post or profile modification
- `Delete`: Post deletion
- `Follow`: Follow request
- `Accept`: Follow acceptance
- `Reject`: Follow rejection
- `Like`: Post like
- `Undo`: Reverse of like or follow
- `Announce`: Boost/share (future)

**Inbound** (Received from remote instances):

- `Create`: Remote post (cached locally if relevant)
- `Update`: Remote post/profile update
- `Delete`: Remove cached remote content
- `Follow`: Follow request from remote user
- `Accept`: Follow acceptance confirmation
- `Like`: Remote user liked local post
- `Undo`: Reverse previous activity
- `Announce`: Remote boost (future)

#### HTTP Signature Verification

**Request Signing** (Outbound):

```python
# Headers signed
signature_headers = [
    "(request-target)",  # POST /inbox
    "host",              # example.com
    "date",              # RFC 2822 format
    "digest"             # SHA-256 of body (POST only)
]

# Signature format
Signature: keyId="{actor_uri}#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="{base64_signature}"
```

**Signature Verification** (Inbound):

```python
# Extract keyId from Signature header
# Fetch public key from remote actor
# Reconstruct signature string
# Verify RSA-SHA256 signature
# Check date within 5 minute window
# Verify digest matches body hash
```

#### Federation Targets

**Post Federation Logic**:

```python
def get_federation_targets(author: User, post: Post) -> list:
    inboxes = []

    # 1. Author's remote followers
    follower_inboxes = Follow.objects.filter(
        following=author,
        accepted=True,
        follower__actor_uri__startswith='https://'  # Remote only
    ).exclude(
        follower__actor_uri__startswith=f'https://{INSTANCE_DOMAIN}'
    ).values_list('follower__inbox_url', flat=True)

    inboxes.extend(follower_inboxes)

    # 2. Nearby Glade instances (if local/public post with location)
    if post.location and post.visibility in [1, 2]:
        nearby_inboxes = get_nearby_instance_inboxes(post)
        inboxes.extend(nearby_inboxes)

    # Remove duplicates
    return list(set(inboxes))
```

#### Well-Known Endpoints

**WebFinger** (`/.well-known/webfinger`):

```json
{
  "subject": "acct:username@domain.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://domain.com/users/username"
    }
  ]
}
```

**NodeInfo** (`/.well-known/nodeinfo`):

```json
{
  "links": [
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
      "href": "https://domain.com/nodeinfo/2.0"
    }
  ]
}
```

**NodeInfo 2.0** (`/nodeinfo/2.0`):

```json
{
  "version": "2.0",
  "software": {
    "name": "glade",
    "version": "0.1.0"
  },
  "protocols": ["activitypub"],
  "services": {
    "inbound": [],
    "outbound": []
  },
  "openRegistrations": true,
  "usage": {
    "users": {
      "total": 100,
      "activeMonth": 50,
      "activeHalfyear": 75
    },
    "localPosts": 1000
  },
  "metadata": {
    "nodeName": "Glade Local",
    "nodeDescription": "A privacy-focused local community",
    "privacyFocused": true,
    "locationAware": true,
    "federation": {
      "enabled": true,
      "locationBased": true,
      "privacyRespecting": true
    }
  }
}
```

---

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

### Standard HTTP Status Codes

#### Success Codes

- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 Created`: Successful POST creating resource
- `202 Accepted`: Accepted for async processing (federation)
- `204 No Content`: Successful DELETE with no response body

#### Client Error Codes

- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource does not exist or user cannot access
- `409 Conflict`: Resource already exists (e.g., duplicate like)
- `429 Too Many Requests`: Rate limit exceeded

#### Server Error Codes

- `500 Internal Server Error`: Unhandled exception
- `502 Bad Gateway`: Federation remote server error
- `503 Service Unavailable`: Database or Redis unavailable

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "detail": "Additional technical details (optional)",
  "code": "ERROR_CODE_CONSTANT (optional)"
}
```

### Success Response Patterns

**Single Resource**:

```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2"
}
```

**Resource List**:

```json
{
    "count": 100,
    "next": "https://api.example.com/resource/?page=2",
    "previous": null,
    "results": [
        {...},
        {...}
    ]
}
```

**Action Confirmation**:

```json
{
  "message": "Action completed successfully",
  "success": true,
  "resource_id": "uuid (optional)"
}
```

---

## Data Migration Strategy

### Schema Migration Process

1. **Create Migration**:

```bash
python manage.py makemigrations accounts
```

2. **Review Generated Migration**:

```python
# migrations/0002_auto_xxxx.py
operations = [
    migrations.AddField(
        model_name='user',
        name='new_field',
        field=models.CharField(max_length=100, default=''),
    ),
]
```

3. **Test Migration**:

```bash
python manage.py migrate --plan
python manage.py sqlmigrate accounts 0002
```

4. **Apply Migration**:

```bash
python manage.py migrate accounts
```

### Data Backfill Pattern

```python
# migrations/0003_backfill_data.py
from django.db import migrations

def backfill_data(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        if not user.notification_preferences:
            NotificationPreference.objects.create(user=user)

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_auto_xxxx'),
    ]
    operations = [
        migrations.RunPython(backfill_data),
    ]
```

---

## Testing Considerations

### Required Test Coverage

#### Model Tests

- Field validation
- Method behavior
- Constraint enforcement
- Cascade deletions
- Default values

#### API Tests

- Authentication requirements
- Authorization rules
- Input validation
- Response serialization
- Error handling
- Rate limiting

#### Privacy Tests

- Location fuzzing accuracy
- Visibility rule enforcement
- Follow relationship checks
- Federation filtering

#### Federation Tests

- HTTP signature generation
- Signature verification
- Activity serialization
- Remote actor caching
- Inbox processing

### Test Database Requirements

- PostgreSQL with PostGIS extension
- Redis (can use fakeredis for unit tests)
- Celery eager mode (synchronous task execution)

---

## Deployment Checklist

### Environment Variables (Production)

```bash
# Django
SECRET_KEY=<random-256-bit-key>
DEBUG=False
ALLOWED_HOSTS=domain.com,www.domain.com
DJANGO_SETTINGS_MODULE=glade.settings.production

# Database
DB_NAME=glade_production
DB_USER=glade_app
DB_PASSWORD=<strong-password>
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Instance
INSTANCE_DOMAIN=domain.com
INSTANCE_NAME=Glade Community
INSTANCE_DESCRIPTION=Privacy-focused local social network
FEDERATION_ENABLED=True

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@domain.com
EMAIL_HOST_PASSWORD=<email-password>
DEFAULT_FROM_EMAIL=noreply@domain.com

# Security
SECURE_SSL_REDIRECT=True
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SECURE=True

# Storage (if using S3)
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_STORAGE_BUCKET_NAME=glade-media
AWS_S3_REGION_NAME=us-east-1

# Monitoring (optional)
SENTRY_DSN=<sentry-dsn>
```

### Database Setup

```sql
-- Create database
CREATE DATABASE glade_production ENCODING 'UTF8';

-- Enable PostGIS
\c glade_production
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Create user
CREATE USER glade_app WITH PASSWORD '<password>';
GRANT ALL PRIVILEGES ON DATABASE glade_production TO glade_app;

-- Grant schema permissions
\c glade_production
GRANT ALL ON SCHEMA public TO glade_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO glade_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO glade_app;
```

### Initial Data Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create cache table (if using database cache)
python manage.py createcachetable
```

### Service Configuration

**Systemd service** (`/etc/systemd/system/glade.service`):

```ini
[Unit]
Description=Glade Django Application
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/gunicorn glade.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -

[Install]
WantedBy=multi-user.target
```

**Celery worker** (`/etc/systemd/system/celery.service`):

```ini
[Unit]
Description=Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/celery -A glade worker \
    --loglevel=info \
    --pidfile=/var/run/celery/worker.pid

[Install]
WantedBy=multi-user.target
```

**Celery beat** (`/etc/systemd/system/celerybeat.service`):

```ini
[Unit]
Description=Celery Beat Scheduler
After=network.target redis.service

[Service]
Type=simple
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/celery -A glade beat \
    --loglevel=info \
    --pidfile=/var/run/celery/beat.pid \
    --schedule=/var/run/celery/celerybeat-schedule

[Install]
WantedBy=multi-user.target
```
