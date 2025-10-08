# Glade Data Model Documentation

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
LOCATION_FUZZING_RADIUS = 100           # Â±100m
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


