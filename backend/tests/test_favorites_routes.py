"""API tests for favorites routes."""

from tests.conftest import auth_headers, login_user, register_user


def valid_space_payload(**overrides):
    payload = {
        "name": "Favorite Loft",
        "location": "Via Test, Bolzano",
        "area_m2": 85.0,
        "category": "Workshop",
        "is_outdoor": False,
    }
    payload.update(overrides)
    return payload


class TestFavoritesRoutes:
    def test_list_empty(self, client, regular_user_token):
        response = client.get(
            "/api/favorites",
            headers=auth_headers(regular_user_token),
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_add_list_and_remove(self, client, space_owner_token, regular_user_token):
        create = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(space_owner_token),
        )
        assert create.status_code == 201
        space_id = create.json()["id"]

        add = client.post(
            f"/api/favorites/{space_id}",
            headers=auth_headers(regular_user_token),
        )
        assert add.status_code == 201
        assert add.json()["favorited"] is True

        listed = client.get(
            "/api/favorites",
            headers=auth_headers(regular_user_token),
        )
        assert listed.status_code == 200
        assert len(listed.json()) == 1
        assert listed.json()[0]["id"] == space_id

        status = client.get(
            f"/api/favorites/{space_id}",
            headers=auth_headers(regular_user_token),
        )
        assert status.status_code == 200
        assert status.json()["favorited"] is True

        remove = client.delete(
            f"/api/favorites/{space_id}",
            headers=auth_headers(regular_user_token),
        )
        assert remove.status_code == 204

        listed_after = client.get(
            "/api/favorites",
            headers=auth_headers(regular_user_token),
        )
        assert listed_after.json() == []

    def test_add_duplicate_is_idempotent(self, client, space_owner_token, regular_user_token):
        create = client.post(
            "/api/spaces",
            json=valid_space_payload(name="Dup Loft"),
            headers=auth_headers(space_owner_token),
        )
        space_id = create.json()["id"]

        client.post(
            f"/api/favorites/{space_id}",
            headers=auth_headers(regular_user_token),
        )
        again = client.post(
            f"/api/favorites/{space_id}",
            headers=auth_headers(regular_user_token),
        )
        assert again.status_code == 201

        listed = client.get(
            "/api/favorites",
            headers=auth_headers(regular_user_token),
        )
        assert len(listed.json()) == 1

    def test_add_unknown_space_returns_404(self, client, regular_user_token):
        response = client.post(
            "/api/favorites/missing-space-id",
            headers=auth_headers(regular_user_token),
        )
        assert response.status_code == 404

    def test_remove_unknown_returns_404(self, client, regular_user_token):
        response = client.delete(
            "/api/favorites/missing-space-id",
            headers=auth_headers(regular_user_token),
        )
        assert response.status_code == 404

    def test_requires_auth(self, client):
        assert client.get("/api/favorites").status_code == 401
