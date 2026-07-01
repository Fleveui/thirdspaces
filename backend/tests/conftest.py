"""Shared pytest fixtures for backend tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    """Fresh in-memory database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """FastAPI test client with database dependency overridden."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(client, username, email, password, account_type="user"):
    return client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "account_type": account_type,
        },
    )


def login_user(client, username, password):
    return client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def space_owner_token(client):
    register_user(
        client,
        username="owner1",
        email="owner1@example.com",
        password="secret12",
        account_type="space_owner",
    )
    response = login_user(client, "owner1", "secret12")
    return response.json()["token"]


@pytest.fixture
def regular_user_token(client):
    register_user(
        client,
        username="user1",
        email="user1@example.com",
        password="secret12",
        account_type="user",
    )
    response = login_user(client, "user1", "secret12")
    return response.json()["token"]
