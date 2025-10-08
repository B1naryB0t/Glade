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
