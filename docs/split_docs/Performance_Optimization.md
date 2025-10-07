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
