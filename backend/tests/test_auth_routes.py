"""API tests for authentication routes."""

from tests.conftest import auth_headers, login_user, register_user


class TestRegisterRoute:
    def test_register_success(self, client):
        response = register_user(
            client,
            username="newuser",
            email="new@example.com",
            password="password123",
            account_type="user",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert data["account_type"] == "user"
        assert "id" in data

    def test_register_duplicate_username_returns_409(self, client):
        register_user(client, "dup", "first@example.com", "password123", "user")
        response = register_user(
            client, "dup", "second@example.com", "password123", "user"
        )

        assert response.status_code == 409
        assert "already taken" in response.json()["detail"]

    def test_register_invalid_payload_returns_422(self, client):
        response = client.post(
            "/api/auth/register",
            json={
                "username": "ab",
                "email": "not-an-email",
                "password": "123",
                "account_type": "invalid",
            },
        )

        assert response.status_code == 422


class TestLoginRoute:
    def test_login_success(self, client):
        register_user(client, "loginuser", "login@example.com", "password123", "user")
        response = login_user(client, "loginuser", "password123")

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["username"] == "loginuser"
        assert data["message"] == "You're successfully logged in!"

    def test_login_invalid_credentials_returns_401(self, client):
        register_user(client, "loginuser", "login@example.com", "password123", "user")
        response = login_user(client, "loginuser", "wrong-password")

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid username or password"


class TestMeRoute:
    def test_me_with_valid_token(self, client, space_owner_token):
        response = client.get("/api/auth/me", headers=auth_headers(space_owner_token))

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "owner1"
        assert data["account_type"] == "space_owner"

    def test_me_without_token_returns_401(self, client):
        response = client.get("/api/auth/me")

        assert response.status_code == 401
        assert response.json()["detail"] == "Missing authentication token"

    def test_me_with_invalid_token_returns_401(self, client):
        response = client.get(
            "/api/auth/me", headers=auth_headers("invalid-token-value")
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid or expired token"
