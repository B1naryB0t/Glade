#!/bin/bash
docker-compose -f backend/infrastructure/docker/docker-compose.test.yml up --build
docker-compose exec backend pytest --maxfail=1 --disable-warnings -q
