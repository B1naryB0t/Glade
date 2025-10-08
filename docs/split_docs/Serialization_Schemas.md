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
