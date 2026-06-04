#!/bin/bash

# Community Space Sharing Platform - Start Script
# Starts all services with Docker Compose and opens the app in a browser
# 
# Usage: ./start.sh
# Prerequisites: Docker Desktop must be running
# 
# What it does:
#   1. Checks if Docker is installed and running
#   2. Builds and starts both frontend and backend with Docker Compose
#   3. Waits for services to be ready
#   4. Opens the app in your default browser
#   5. Prints a summary of running services

set -e

echo "🚀 Starting Community Space Sharing Platform..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    echo "Docker Desktop includes Docker Compose. Please check your Docker installation."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Build and start services
echo "Building and starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✓ Services are running"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Services are taking longer to start. They may still be initializing."
fi

echo ""
echo "✅ Community Space Sharing Platform is running!"
echo ""
echo "Services:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "Stop the services with: ./stop.sh"
echo ""

# Open in browser (macOS)
if command -v open &> /dev/null; then
    sleep 2
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    # Linux
    sleep 2
    xdg-open "http://localhost:3000"
else
    echo "ℹ️  Manually open http://localhost:3000 in your browser"
fi
