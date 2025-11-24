# backend/glade/settings/development.py
from .base import *

DEBUG = True

# Allow ngrok domain from environment variable
NGROK_DOMAIN = config('NGROK_DOMAIN', default='')
# Check if ALLOWED_HOSTS is set in environment, otherwise use defaults
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0', cast=lambda v: [h.strip() for h in v.split(',')])
# Also add NGROK_DOMAIN if set separately
if NGROK_DOMAIN and NGROK_DOMAIN not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(NGROK_DOMAIN)

# CORS settings for development
CORS_ALLOWED_ORIGINS_ENV = config('CORS_ALLOWED_ORIGINS', default='', cast=lambda v: [o.strip() for o in v.split(',') if o.strip()])
if CORS_ALLOWED_ORIGINS_ENV:
    CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_ENV
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    if NGROK_DOMAIN:
        CORS_ALLOWED_ORIGINS.append(f"https://{NGROK_DOMAIN}")

CORS_ALLOW_ALL_ORIGINS = True  # Only for development

# Allow custom headers for ngrok and ActivityPub
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'ngrok-skip-browser-warning',  # For ngrok development
]

# Use local memory cache for development if Redis is not available
# This ensures throttling works even without Redis running
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# Add debug toolbar (only if installed)
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS += ["debug_toolbar"]
        MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
        INTERNAL_IPS = ["127.0.0.1", "0.0.0.0"]
    except ImportError:
        # Debug toolbar not installed yet (first container startup)
        pass

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "federation": {
            "handlers": ["console"],
            "level": "DEBUG",
        },
    },
}
