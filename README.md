# Glade

A privacy-focused, location-aware, federated social media platform designed for local community building with ActivityPub compatibility.

## Overview

Glade is designed to be an ethical alternative to mainstream social media platforms, focusing on local communities without advertising or user tracking. It enables self-hosted instances that can federate with other ActivityPub-compatible platforms while maintaining strong privacy guarantees.

### Key Features

- **Privacy-First Design**: User-controlled location fuzzing, privacy levels, and data protection
- **Local Community Focus**: Location-based content discovery and "Groves" (geographic communities)
- **Federation**: ActivityPub-compatible for cross-instance communication
- **Self-Hostable**: Easy deployment for community organizations
- **No Tracking**: No advertising, analytics, or user surveillance

## Architecture

Glade uses a modern stack optimized for geospatial data and federation:

### Backend

- **Framework**: Django with Django REST Framework
- **Database**: PostgreSQL with PostGIS extension for geospatial queries
- **Cache**: Redis for session management and rate limiting
- **Task Queue**: Celery for async federation and background tasks
- **Federation**: Custom ActivityPub implementation

### Key Technologies

- **PostGIS**: Geospatial database for location-based features
- **ActivityPub**: Federated protocol implementation
- **HTTP Signatures**: Request signing for federation security
- **RSA Keypairs**: User authentication for federation

## Project Structure

```
backend/
├── accounts/           # User management and authentication
├── posts/              # Post creation and interactions
├── federation/         # ActivityPub federation logic
├── communities/        # Grove (community) management
├── privacy/            # Privacy controls and middleware
├── glade/              # Project settings and configuration
└── manage.py           # Django management script
```

## Getting Started

### Prerequisites

- Python 3.10+
- PostgreSQL 14+ with PostGIS extension
- Redis 6+
- Node.js 16+ (for future frontend)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/glade.git
cd glade
```

2. **Set up PostgreSQL with PostGIS**

```bash
# Install PostGIS (Ubuntu/Debian)
sudo apt-get install postgresql-14-postgis-3

# Create database
sudo -u postgres psql
CREATE DATABASE glade;
CREATE USER glade WITH PASSWORD 'your_password';
ALTER DATABASE glade OWNER TO glade;
\c glade
CREATE EXTENSION postgis;
\q
```

3. **Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

4. **Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

5. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your settings
```

Example `.env`:

```
DATABASE_URL=postgresql://glade:your_password@localhost:5432/glade
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=True
INSTANCE_DOMAIN=localhost:8000
INSTANCE_NAME=My Glade Instance
FEDERATION_ENABLED=True
```

6. **Run migrations**

```bash
python manage.py migrate
```

7. **Create superuser**

```bash
python manage.py createsuperuser
```

8. **Start services**

Terminal 1 - Django server:

```bash
python manage.py runserver
```

Terminal 2 - Celery worker:

```bash
celery -A glade worker -l info
```

Terminal 3 - Redis (if not running as service):

```bash
redis-server
```

## Core Concepts

### Privacy Levels

Glade implements three privacy levels for users:

1. **Public (1)**: Profile and content visible to everyone
2. **Local (2)**: Visible to local instance and nearby federated instances
3. **Private (3)**: Visible only to followers

### Post Visibility

Posts can have four visibility settings:

1. **Public**: Visible to everyone, federates globally
2. **Local**: Visible to local instance and nearby locations
3. **Followers**: Only visible to followers
4. **Private**: Only visible to author

### Location Privacy

- User locations are automatically fuzzed within a configurable radius (default ±100m)
- Users control their location privacy radius (1km default, max 50km)
- Approximate locations are used for local discovery without exposing exact coordinates

### Groves

Groves are geographic communities within Glade representing:

- Neighborhoods
- Cities
- Local interest groups
- Regional communities

Multiple Groves can exist within one Glade instance (representing a state or larger region).

## API Endpoints

### Authentication

```
POST /api/auth/register/
POST /api/auth/login/
GET  /api/auth/profile/me/
```

### Posts

```
GET    /api/posts/              # List posts (filtered by privacy)
POST   /api/posts/              # Create post
GET    /api/posts/local/        # Get nearby posts
POST   /api/posts/{id}/like/    # Like post
DELETE /api/posts/{id}/like/    # Unlike post
```

### Users

```
GET  /api/profile/{username}/
PUT  /api/profile/me/
POST /api/follow/{username}/
DELETE /api/follow/{username}/
```

### Federation (ActivityPub)

```
GET  /.well-known/webfinger     # WebFinger discovery
GET  /.well-known/nodeinfo      # NodeInfo discovery
GET  /users/{username}          # Actor endpoint
POST /users/{username}/inbox    # User inbox
POST /inbox                     # Shared inbox
```

## Configuration

### Django Settings

Key settings in `glade/settings/base.py`:

```python
# Instance configuration
INSTANCE_DOMAIN = "your-domain.com"
INSTANCE_NAME = "Your Instance Name"
INSTANCE_DESCRIPTION = "A privacy-focused local community"

# Privacy settings
DEFAULT_LOCATION_RADIUS = 1000  # meters
MAX_LOCATION_RADIUS = 50000     # meters
LOCATION_FUZZING_RADIUS = 100   # meters

# Federation
FEDERATION_ENABLED = True
```

### Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: Django secret key
- `INSTANCE_DOMAIN`: Your instance domain
- `FEDERATION_ENABLED`: Enable/disable federation

## Federation

Glade implements ActivityPub for federation with other platforms like Mastodon, Pleroma, and other Glade instances.

### Supported Activities

- **Follow/Accept/Reject**: User following
- **Create/Update/Delete**: Post management
- **Like/Undo**: Post interactions
- **Announce**: Sharing/boosting

### Federation Flow

1. User creates post
2. If not local-only, post is serialized to ActivityPub Note
3. Celery task federates to relevant inboxes (followers, nearby instances)
4. Remote servers receive and process activity
5. Incoming activities are verified via HTTP signatures

### Security

- All federated requests are signed using RSA keypairs
- HTTP Signatures verify sender authenticity
- Instance trust levels control federation behavior

## Development

### Running Tests

```bash
python manage.py test
```

### Code Style

Follow PEP 8 guidelines. Use Black for formatting:

```bash
pip install black
black .
```

### Database Migrations

Create migrations after model changes:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Deployment

### Production Settings

Use `glade/settings/production.py` for production:

```bash
export DJANGO_SETTINGS_MODULE=glade.settings.production
```

Key production configurations:

- Set `DEBUG=False`
- Configure `ALLOWED_HOSTS`
- Use strong `SECRET_KEY`
- Enable HTTPS with proper SSL certificates
- Configure email backend
- Set up static file serving
- Configure Celery with production broker

### Recommended Production Stack

- **Web Server**: Nginx
- **WSGI Server**: Gunicorn
- **Database**: PostgreSQL 14+ with PostGIS
- **Cache**: Redis
- **Task Queue**: Celery with Redis broker
- **Process Manager**: Systemd or Supervisor

## Monitoring

### Logging

Logs are written to:

- Django logs: Standard Django logging
- Celery logs: Task execution logs
- Federation logs: ActivityPub activity logs

## Security

### Best Practices

1. Always use HTTPS in production
2. Keep dependencies updated
3. Regular security audits
4. Monitor failed authentication attempts
5. Implement rate limiting
6. Regular database backups

### Privacy Considerations

- Location data is always fuzzed
- Users control their privacy levels
- No analytics or tracking
- Data minimization principles
- Right to be forgotten (account deletion)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## Roadmap

### Current Focus

- Core user and post functionality
- Basic federation support
- Privacy controls

### Planned Features

- Grove (community) implementation
- User proposals and community governance
- Enhanced moderation tools
- Account migration/transfer
- Improved discovery features

### Out of Scope

- Cryptocurrency features
- AI/generative content
- Gamification
- Native mobile apps (responsive web design only)
- Video/audio content
- Marketplace/e-commerce

## License

Glade is licensed under GPL-2.0

## Support

For all support, it is suggested to open github issues.

## Acknowledgments

Built with privacy-first principles for local communities. Inspired by the fediverse and ethical social media movements.

---

**Note**: Glade is currently in active development. Some features may not be fully implemented. Contributions and feedback are welcome!
