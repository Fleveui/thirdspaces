#!/bin/bash

# Community Space Sharing Platform - Stop Script
# Cleanly shuts down all services
# 
# Usage: ./stop.sh

echo "🛑 Stopping Community Space Sharing Platform..."
echo ""

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Stop and remove containers
docker-compose down

echo ""
echo "✅ Services stopped"
echo ""
echo "To start again: ./start.sh"
