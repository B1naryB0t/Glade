#!/bin/bash
set -e

echo "Glade Development Environment - One-Time Setup"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "Docker is required. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is required. Please install Docker Compose first."
    exit 1
fi

# Start services
echo "Starting services..."
cd infrastructure/docker
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 15

# ONE-TIME SETUP: Enable PostGIS extension
echo "Checking if PostGIS extension is enabled..."
if ! docker-compose exec -T postgres psql -U glade -d glade -tAc "SELECT 1 FROM pg_extension WHERE extname='postgis';" | grep -q 1; then
    echo "Enabling PostGIS extension..."
    docker-compose exec -T postgres psql -U glade -d glade -c "CREATE EXTENSION IF NOT EXISTS postgis;"
else
    echo "PostGIS extension already enabled."
fi

# ONE-TIME SETUP: Run initial migrations
echo "Running initial migrations..."
docker-compose exec backend python manage.py makemigrations accounts posts federation privacy
docker-compose exec backend python manage.py migrate

# ONE-TIME SETUP: Create demo superuser
echo "Creating demo user..."
docker-compose exec backend python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(username='demo').exists():
    User.objects.create_user('demo', 'demo@example.com', 'demo123', display_name='Demo User')
    print('Demo user created: demo/demo123')
"

echo ""
echo "✅ Development environment setup complete!"
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
echo "To stop all services:"
echo "  - From project root:"
echo "     docker-compose -f infrastructure/docker/docker-compose.yml down"
echo "  - From infrastructure/docker:"
echo "     docker-compose down"