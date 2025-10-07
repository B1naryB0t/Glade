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
