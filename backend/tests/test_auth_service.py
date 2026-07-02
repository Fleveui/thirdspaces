"""Unit tests for authentication service functions."""

from services.auth import (
    authenticate_user,
    create_access_token,
    hash_password,
    register_user,
    verify_password,
    verify_token,
)


class TestPasswordHashing:
    def test_hash_and_verify_password(self):
        hashed = hash_password("my-secret-password")
        assert hashed != "my-secret-password"
        assert verify_password("my-secret-password", hashed)
        assert not verify_password("wrong-password", hashed)


class TestTokens:
    def test_create_and_verify_token(self):
        token, expires = create_access_token("user-123")
        assert token
        assert expires
        assert verify_token(token) == "user-123"

    def test_verify_invalid_token(self):
        assert verify_token("not-a-valid-token") is None


class TestRegisterUser:
    def test_register_user_success(self, db):
        from models import PersonalAccount

        user, error = register_user(
            username="alice",
            email="alice@example.com",
            password="password123",
            account_type="user",
            db=db,
        )

        assert error is None
        assert user is not None
        assert user.username == "alice"
        assert user.email == "alice@example.com"
        assert user.account_type.value == "user"
        assert verify_password("password123", user.password_hash)
        profile = db.query(PersonalAccount).filter(PersonalAccount.id == user.id).first()
        assert profile is not None
        assert profile.email == "alice@example.com"

    def test_register_space_owner(self, db):
        from models import BusinessAccount

        user, error = register_user(
            username="bob",
            email="bob@example.com",
            password="password123",
            account_type="space_owner",
            db=db,
        )

        assert error is None
        assert user.account_type.value == "space_owner"
        business = db.query(BusinessAccount).filter(BusinessAccount.id == user.id).first()
        assert business is not None

    def test_register_duplicate_username(self, db):
        register_user("alice", "alice@example.com", "password123", "user", db)
        user, error = register_user(
            "alice", "other@example.com", "password123", "user", db
        )

        assert user is None
        assert "already taken" in error

    def test_register_duplicate_email(self, db):
        register_user("alice", "alice@example.com", "password123", "user", db)
        user, error = register_user(
            "other", "alice@example.com", "password123", "user", db
        )

        assert user is None
        assert "already in use" in error

    def test_register_invalid_account_type(self, db):
        user, error = register_user(
            "alice", "alice@example.com", "password123", "admin", db
        )

        assert user is None
        assert "Invalid account type" in error


class TestAuthenticateUser:
    def test_authenticate_valid_credentials(self, db):
        register_user("alice", "alice@example.com", "password123", "user", db)
        user, error = authenticate_user("alice", "password123", db)

        assert error is None
        assert user.username == "alice"

    def test_authenticate_wrong_password(self, db):
        register_user("alice", "alice@example.com", "password123", "user", db)
        user, error = authenticate_user("alice", "wrong-password", db)

        assert user is None
        assert error == "Invalid username or password"

    def test_authenticate_unknown_user(self, db):
        user, error = authenticate_user("nobody", "password123", db)

        assert user is None
        assert error == "Invalid username or password"
