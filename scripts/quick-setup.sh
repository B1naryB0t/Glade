#!/bin/bash
set -e

echo "Quick Glade Setup for Demo"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "Docker is required. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is required. Please install Docker Compose first."
    exit 1
fi

# Create .env file
echo " Creating environment configuration..."
cat > backend/.env << EOF
DATABASE_URL=postgresql://glade:glade_dev_password@localhost:5432/glade
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=demo-secret-key-change-in-production
DEBUG=True
INSTANCE_DOMAIN=localhost:8000
INSTANCE_NAME=Glade Demo
FEDERATION_ENABLED=False
EOF

# Start services
echo "Starting services..."
cd infrastructure/docker
docker-compose up -d postgres redis

# Wait for database
echo "Waiting for database..."
sleep 10

echo "Checking if PostGIS extension is enabled..."
if ! docker-compose exec -T postgres psql -U glade -d glade -tAc "SELECT 1 FROM pg_extension WHERE extname='postgis';" | grep -q 1; then
    echo "Enabling PostGIS extension..."
    docker-compose exec -T postgres psql -U glade -d glade -c "CREATE EXTENSION IF NOT EXISTS postgis;"
else
    echo "PostGIS extension already enabled."
fi

# Build backend with optional --no-cache flag
# If --no-cache is passed as the first argument, use it; otherwise build with cache
if [[ "$1" == "--no-cache" ]]; then
    echo "Building backend without cache..."
    docker-compose build --no-cache backend
else
    echo "Building backend with cache..."
    docker-compose build backend
fi

# Start backend
echo "Starting backend..."
docker-compose up -d backend

# Wait for backend
echo "Waiting for backend..."
sleep 15

# Run migrations
echo "Setting up database..."
docker-compose exec backend python manage.py makemigrations accounts posts federation privacy
docker-compose exec backend python manage.py migrate

# Create superuser
echo "Creating demo user..."
docker-compose exec backend python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(username='demo').exists():
    User.objects.create_user('demo', 'demo@example.com', 'demo123', display_name='Demo User')
    print('Demo user created: demo/demo123')
"

# Start frontend
docker-compose up -d frontend celery

echo "Demo setup complete!"
echo ""
echo "🌐 Access Glade:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "Demo credentials:"
echo "   Username: demo"
echo "   Password: demo123"
echo ""
echo "To stop: cd infrastructure/docker && docker-compose down"
