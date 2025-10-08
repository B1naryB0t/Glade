## Deployment Checklist

### Environment Variables (Production)

```bash
# Django
SECRET_KEY=<random-256-bit-key>
DEBUG=False
ALLOWED_HOSTS=domain.com,www.domain.com
DJANGO_SETTINGS_MODULE=glade.settings.production

# Database
DB_NAME=glade_production
DB_USER=glade_app
DB_PASSWORD=<strong-password>
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Instance
INSTANCE_DOMAIN=domain.com
INSTANCE_NAME=Glade Community
INSTANCE_DESCRIPTION=Privacy-focused local social network
FEDERATION_ENABLED=True

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@domain.com
EMAIL_HOST_PASSWORD=<email-password>
DEFAULT_FROM_EMAIL=noreply@domain.com

# Security
SECURE_SSL_REDIRECT=True
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SECURE=True

# Storage (if using S3)
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_STORAGE_BUCKET_NAME=glade-media
AWS_S3_REGION_NAME=us-east-1

# Monitoring (optional)
SENTRY_DSN=<sentry-dsn>
```

### Database Setup

```sql
-- Create database
CREATE DATABASE glade_production ENCODING 'UTF8';

-- Enable PostGIS
\c glade_production
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Create user
CREATE USER glade_app WITH PASSWORD '<password>';
GRANT ALL PRIVILEGES ON DATABASE glade_production TO glade_app;

-- Grant schema permissions
\c glade_production
GRANT ALL ON SCHEMA public TO glade_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO glade_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO glade_app;
```

### Initial Data Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create cache table (if using database cache)
python manage.py createcachetable
```

### Service Configuration

**Systemd service** (`/etc/systemd/system/glade.service`):

```ini
[Unit]
Description=Glade Django Application
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/gunicorn glade.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -

[Install]
WantedBy=multi-user.target
```

**Celery worker** (`/etc/systemd/system/celery.service`):

```ini
[Unit]
Description=Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/celery -A glade worker \
    --loglevel=info \
    --pidfile=/var/run/celery/worker.pid

[Install]
WantedBy=multi-user.target
```

**Celery beat** (`/etc/systemd/system/celerybeat.service`):

```ini
[Unit]
Description=Celery Beat Scheduler
After=network.target redis.service

[Service]
Type=simple
User=glade
Group=glade
WorkingDirectory=/opt/glade
Environment="DJANGO_SETTINGS_MODULE=glade.settings.production"
ExecStart=/opt/glade/venv/bin/celery -A glade beat \
    --loglevel=info \
    --pidfile=/var/run/celery/beat.pid \
    --schedule=/var/run/celery/celerybeat-schedule

[Install]
WantedBy=multi-user.target
```
