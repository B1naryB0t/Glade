# backend/glade/settings/development.py
from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = True  # Only for development

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
