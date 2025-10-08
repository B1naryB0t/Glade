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

## Data Retention
