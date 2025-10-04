# Project Structure Documentation

**Document Version**: 1.0  
**Date**: October 4, 2025
**Purpose**: This guide explains how to set up and understand the Glade development environment using Docker.

---

## Quick Start

1. **One-time setup** (run this to setup the development environment):
   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Start the environment** (run this every time you want to work):
   ```bash
   cd infrastructure/docker
   docker-compose up
   ```

3. **Stop the environment**:
   ```bash
   docker-compose down
   ```

---

## Configuration Files

### 1. `infrastructure/docker/docker-compose.yml`

**Purpose**: Base configuration for DEVELOPMENT environment

**What it does**:
- Defines all services
- Sets up networking between containers
- Configures health checks
- Defines volumes for data persistence
- Sets environment variables [for development]

**Note**:
- This is used automatically when you run `docker-compose up`
- Production will use `docker-compose.prod.yml` instead [to be created]

---

### 2. `infrastructure/docker/docker-compose.override.yml`

**Purpose**: Development-specific overrides (automatically merged)

**What it does**:
- Mounts `requirements/` directory into the backend container
- Installs development dependencies (`django-debug-toolbar`, testing tools, etc.) on container startup
- Overrides the backend command to install dev packages before starting Django

**Note**:
- Docker Compose automatically loads this file when you run `docker-compose up`
- Only used in development; production ignores this file
- Dev dependencies are installed fresh each time the container starts

---

### 3. `infrastructure/docker/Dockerfile.backend`

**Purpose**: Defines how to build the backend Docker image

**What it does**:
- Starts from a Python 3.11 base image
- Installs system dependencies (gcc, PostGIS libraries, etc.)
- Copies `requirements/base.txt` and installs **only** production Python packages
- Copies the Django application code
- Sets the working directory and exposes port 8000

- **Does NOT** install development dependencies (keeps image lean)
- Development dependencies are installed later via `docker-compose.override.yml`


---

### 4. `scripts/dev-setup.sh`

**Purpose**: One-time initialization script for development environment

**What it does**:
1. Checks that Docker and Docker Compose are installed
2. Starts all services with `docker-compose up -d`
3. Waits for services to be healthy
4. **ONE-TIME TASKS**:
   - Enables PostGIS extension in the database
   - Runs initial Django migrations
   - Creates a demo user account

- Run this script **only once** when you first clone the project
- After the initial setup, just use `docker-compose up` to start services

---

### Daily Development (Every Time You Work)

1. You run `docker-compose up` in `infrastructure/docker/`
2. Docker Compose automatically merges `docker-compose.yml` + `docker-compose.override.yml`
3. Backend container starts and:
   - Installs dev dependencies fresh [ensures latest versions]
   - Starts Django with `runserver` (hot reload enabled)
4. You can access:
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000
   - Admin panel: http://localhost:8000/admin



## Common Commands

### Start the development environment
```bash
cd infrastructure/docker
docker-compose up

# -d flag will run it in the background
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs backend
docker-compose logs -f backend  # Follow logs
```

---

## Troubleshooting

### ⚠️ When to Rebuild: Requirements or Major Changes

**CRITICAL**: If you modify `requirements/` (or make other major changes), the changes won't automatically apply, you must rebuild.

**How to rebuild**:
```bash
cd infrastructure/docker

# Option 1: Full rebuild (recommended when things are broken)
docker-compose down
docker-compose build --no-cache
docker-compose up

```

---

**Document Control**
- **Next Review**: Weekly during development
- **Approval**: Development team lead
- **Distribution**: Public