from .base import *
import os
import ctypes

# Explicit GDAL + GEOS paths for macOS + pyenv
os.environ["GDAL_LIBRARY_PATH"] = "/opt/homebrew/opt/gdal/lib/libgdal.dylib"
os.environ["GEOS_LIBRARY_PATH"] = "/opt/homebrew/opt/geos/lib/libgeos_c.dylib"

# Also extend DYLD_LIBRARY_PATH so macOS dynamic linker finds them
os.environ["DYLD_LIBRARY_PATH"] = (
    "/opt/homebrew/opt/gdal/lib:/opt/homebrew/opt/geos/lib:" +
    os.environ.get("DYLD_LIBRARY_PATH", "")
)

# Force-load the GDAL library manually so Django's import sees it
try:
    ctypes.CDLL(os.environ["GDAL_LIBRARY_PATH"])
except OSError as e:
    print("Could not manually load GDAL library:", e)



# --- DATABASE CONFIG ---
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "glade_test",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# --- REDIS / CELERY CONFIG ---
CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"

# --- TESTING FLAGS ---
DEBUG = False
TEST = True
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

GDAL_LIBRARY_PATH = os.getenv("GDAL_LIBRARY_PATH", "/opt/homebrew/opt/gdal/lib/libgdal.dylib")
GEOS_LIBRARY_PATH = os.getenv("GEOS_LIBRARY_PATH", "/opt/homebrew/opt/geos/lib/libgeos_c.dylib")
