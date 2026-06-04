# Community Space Sharing Platform - Backend Configuration

import os
from datetime import timedelta

# Server configuration
HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
PORT = int(os.getenv("BACKEND_PORT", "8000"))

# Frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Database configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", "app.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# JWT configuration for authentication
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# CORS configuration
ALLOWED_ORIGINS = [FRONTEND_URL]

# Password hashing configuration
PASSWORD_HASH_SCHEME = "bcrypt"
PASSWORD_HASH_ROUNDS = 12
