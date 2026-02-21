#!/bin/bash
# LearnSync AI v1.0 - Production Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}LearnSync AI v1.0 Deployment${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}=================================${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "${RED}Please configure .env file before deploying${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs/nginx logs/backend logs/ai-service
mkdir -p data/mongo data/redis
mkdir -p models uploads

# Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
docker-compose -f $COMPOSE_FILE pull

# Build services
echo -e "${YELLOW}Building services...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Health checks
echo -e "${YELLOW}Running health checks...${NC}"

HEALTH_STATUS=0

# Check Nginx
if curl -sf http://localhost/health > /dev/null; then
    echo -e "${GREEN}✓ Nginx is healthy${NC}"
else
    echo -e "${RED}✗ Nginx health check failed${NC}"
    HEALTH_STATUS=1
fi

# Check Backend
if curl -sf http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
else
    echo -e "${RED}✗ Backend API health check failed${NC}"
    HEALTH_STATUS=1
fi

# Check AI Service
if curl -sf http://localhost/ai/health > /dev/null; then
    echo -e "${GREEN}✓ AI Service is healthy${NC}"
else
    echo -e "${RED}✗ AI Service health check failed${NC}"
    HEALTH_STATUS=1
fi

if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}Deployment successful!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}Application: http://localhost${NC}"
    echo -e "${GREEN}Grafana: http://localhost:3001${NC}"
    echo -e "${GREEN}=================================${NC}"
else
    echo -e "${RED}=================================${NC}"
    echo -e "${RED}Deployment completed with warnings${NC}"
    echo -e "${RED}Check logs: docker-compose logs${NC}"
    echo -e "${RED}=================================${NC}"
fi

exit $HEALTH_STATUS