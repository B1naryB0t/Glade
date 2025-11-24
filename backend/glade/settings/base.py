import os
from pathlib import Path

import dj_database_url

# from celery.schedules import crontab # disabled until later stages of development
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-me")
DEBUG = config("DEBUG", default=False, cast=bool)

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # "oauth2_provider",  # Not currently used
]

LOCAL_APPS = [
    "accounts",
    "posts",
    "federation",
    "privacy",
    "notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # "whitenoise.middleware.WhiteNoiseMiddleware",  # not currently needed
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "privacy.middleware.PrivacyMiddleware",
]

ROOT_URLCONF = "glade.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "glade.wsgi.application"


# Use DATABASE_URL if available, otherwise fallback to individual settings
db_from_env = dj_database_url.config(default=config("DATABASE_URL", default=""))
if db_from_env:
    DATABASES = {"default": db_from_env}
    # Override engine to use PostGIS for GIS support
    DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": config("DB_NAME", default="glade"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

# Cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("REDIS_CACHE_URL", default="redis://127.0.0.1:6379/1"),
    }
}

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "registration": "2/hour",  # 2 registrations per hour per IP
        "resend_verification": "1/5min",  # 1 request per 5 minutes (enforces wait time)
        "password_reset": "3/hour",  # Password reset requests per IP
        "anon": "100/hour",  # General anonymous rate limit
        "user": "1000/hour",  # General authenticated user rate limit
        "login": "3/hour",  # Failed login attempts per IP (handled in view logic)
        "follow": "30/hour",  # Follow/unfollow actions per user
        "comment": "60/hour",  # Comment creation per user
        "upload": "20/hour",  # File uploads per user
        "search": "100/hour",  # Search requests per user
        "federation_inbox": "300/hour",  # Incoming federation activities per IP
    },
}

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Custom user model
AUTH_USER_MODEL = "accounts.User"

# Authentication backends
AUTHENTICATION_BACKENDS = [
    "accounts.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# Celery
CELERY_BROKER_URL = config("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = config("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

# Glade settings
INSTANCE_DOMAIN = config("INSTANCE_DOMAIN", default="localhost:8000")
INSTANCE_NAME = config("INSTANCE_NAME", default="Glade Development")
INSTANCE_DESCRIPTION = config(
    "INSTANCE_DESCRIPTION", default="A privacy-focused local community"
)
FEDERATION_ENABLED = config("FEDERATION_ENABLED", default=True, cast=bool)

# Privacy settings
DEFAULT_LOCATION_RADIUS = config("DEFAULT_LOCATION_RADIUS", default=1000, cast=int)
MAX_LOCATION_RADIUS = config("MAX_LOCATION_RADIUS", default=50000, cast=int)
LOCATION_FUZZING_RADIUS = config("LOCATION_FUZZING_RADIUS", default=100, cast=int)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@glade.local")


# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Security Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "logs/security.log",
            "formatter": "verbose",
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "security": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Session Security
SESSION_COOKIE_SECURE = not DEBUG  # True in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 1209600  # 2 weeks
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True

# unnecessary for this stage of the project
# Celery Beat Schedule (for cleanup tasks)
#
# CELERY_BEAT_SCHEDULE = {
#     "cleanup-old-notifications": {
#         "task": "notifications.tasks.cleanup_old_notifications",
#         "schedule": crontab(hour=2, minute=0),  # Run at 2 AM daily
#     },
#     "cleanup-old-login-attempts": {
#         "task": "notifications.tasks.cleanup_old_login_attempts",
#         "schedule": crontab(hour=2, minute=30),  # Run at 2:30 AM daily
#     },
# }


# ActivityPub app removed - using 'federation' app instead
# INSTALLED_APPS += [
#     "activitypub",
# ]

# Feature flag for ActivityPub (default off)
ACTIVITYPUB_ENABLED = os.environ.get("ACTIVITYPUB_ENABLED", "false").lower() in (
    "1",
    "true",
    "yes",
)

# ActivityPub delivery defaults
ACTIVITYPUB_DEFAULT_FROM = os.environ.get(
    "ACTIVITYPUB_DEFAULT_FROM", "no-reply@example.local"
)
# Retry/backoff settings for Celery tasks
ACTIVITYPUB_DELIVERY_MAX_RETRIES = int(
    os.environ.get("ACTIVITYPUB_DELIVERY_MAX_RETRIES", "5")
)
