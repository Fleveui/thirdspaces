#!/usr/bin/env python3
# Community Space Sharing Platform - Backend Server
# Entry point: starts the FastAPI HTTP server
# 
# Architecture:
#   main.py (this file) → imports and starts the server
#   └── routes/auth.py → API endpoints (login, register, me, logout)
#       └── services/auth.py → business logic (password hashing, token generation)
#           └── models.py → database tables
#               └── database.py → SQLite connection
#
# See ARCHITECTURE.md for the full system diagram
# See STRUCTURE.md for file organization
# See DECISIONS.md for implementation choices

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.spaces import router as spaces_router
from routes.bookings import router as bookings_router
import config

# Create FastAPI application
app = FastAPI(
    title="Community Space Sharing Platform",
    description="Backend API for space discovery and booking",
    version="0.1.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# Allows requests from frontend (http://localhost:3000)
# → see DECISIONS.md #11 (Docker Compose setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
# POST /api/auth/register - create new account
# POST /api/auth/login - authenticate user
# GET /api/auth/me - get current user info
# POST /api/auth/logout - clear session
app.include_router(auth_router)

# Include spaces routes
# GET /api/spaces - list all spaces
# GET /api/spaces/mine - list current owner's spaces
# GET /api/spaces/{id} - get space details
app.include_router(spaces_router)

# Include bookings routes
# GET /api/bookings/mine - list bookings for owner's spaces
# GET /api/bookings/{id} - booking detail
# PATCH /api/bookings/{id}/approve - approve pending booking
# PATCH /api/bookings/{id}/reject - reject pending booking
app.include_router(bookings_router)

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Community Space Sharing Platform API",
        "status": "running",
        "docs": "/docs"  # Swagger UI documentation
    }

@app.get("/health")
def health():
    """Liveness probe for container orchestration"""
    return {"status": "healthy"}

if __name__ == "__main__":
    # Run the server
    # → see start.sh for the full startup procedure
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True  # Auto-reload on file changes (development only)
    )
