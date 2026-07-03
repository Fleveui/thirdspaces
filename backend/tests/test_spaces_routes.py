"""API tests for spaces routes."""

from tests.conftest import auth_headers, login_user, register_user


def valid_space_payload(**overrides):
    payload = {
        "name": "New Loft",
        "location": "Via Test, Milano",
        "area_m2": 85.0,
        "category": "Loft",
        "is_outdoor": False,
        "availability": "Flexible",
        "description": "Great space",
        "rules": "Be respectful",
        "deposit_needed": 300.0,
    }
    payload.update(overrides)
    return payload


class TestListSpaces:
    def test_list_spaces_empty(self, client):
        response = client.get("/api/spaces")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_spaces_returns_created_space(self, client, space_owner_token):
        create_response = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(space_owner_token),
        )
        assert create_response.status_code == 201

        response = client.get("/api/spaces")
        spaces = response.json()

        assert response.status_code == 200
        assert len(spaces) == 1
        assert spaces[0]["name"] == "New Loft"

    def test_list_spaces_excludes_own_when_authenticated(self, client, space_owner_token):
        create_response = client.post(
            "/api/spaces",
            json=valid_space_payload(name="My Loft"),
            headers=auth_headers(space_owner_token),
        )
        assert create_response.status_code == 201
        space_id = create_response.json()["id"]

        auth_response = client.get(
            "/api/spaces",
            headers=auth_headers(space_owner_token),
        )
        assert auth_response.status_code == 200
        auth_names = [s["name"] for s in auth_response.json()]
        assert "My Loft" not in auth_names

        public_response = client.get("/api/spaces")
        assert public_response.status_code == 200
        public_ids = [s["id"] for s in public_response.json()]
        assert space_id in public_ids

    def test_list_spaces_includes_other_owners(self, client, space_owner_token):
        register_user(
            client,
            username="otherhost",
            email="otherhost@example.com",
            password="secret12",
            account_type="user",
        )
        other_token = login_user(client, "otherhost", "secret12").json()["token"]

        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Other Host Loft", location="Bolzano"),
            headers=auth_headers(other_token),
        )
        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Owner Loft"),
            headers=auth_headers(space_owner_token),
        )

        response = client.get(
            "/api/spaces",
            headers=auth_headers(space_owner_token),
        )
        names = [s["name"] for s in response.json()]
        assert "Other Host Loft" in names
        assert "Owner Loft" not in names

    def test_list_spaces_filters_by_max_people(self, client, space_owner_token):
        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Small Space", max_people=10),
            headers=auth_headers(space_owner_token),
        )
        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Large Space", max_people=50),
            headers=auth_headers(space_owner_token),
        )

        response = client.get("/api/spaces?min_people=40")
        names = [s["name"] for s in response.json()]
        assert "Large Space" in names
        assert "Small Space" not in names


class TestListMySpaces:
    def test_list_my_spaces_empty(self, client, space_owner_token):
        response = client.get(
            "/api/spaces/mine",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_list_my_spaces_returns_only_owner_spaces(self, client, space_owner_token):
        register_user(
            client,
            username="owner2",
            email="owner2@example.com",
            password="secret12",
            account_type="space_owner",
        )
        other_owner_login = login_user(client, "owner2", "secret12")
        other_owner_token = other_owner_login.json()["token"]

        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Owner Loft", location="Milan"),
            headers=auth_headers(space_owner_token),
        )
        client.post(
            "/api/spaces",
            json=valid_space_payload(name="Other Loft", location="Rome"),
            headers=auth_headers(other_owner_token),
        )

        response = client.get(
            "/api/spaces/mine",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        listings = response.json()
        assert len(listings) == 1
        assert listings[0]["name"] == "Owner Loft"
        assert listings[0]["location"] == "Milan"
        assert "owner_id" not in listings[0]
        assert "area_m2" not in listings[0]

    def test_list_my_spaces_without_auth_returns_401(self, client):
        response = client.get("/api/spaces/mine")

        assert response.status_code == 401

    def test_list_my_spaces_as_regular_user_returns_empty(self, client, regular_user_token):
        response = client.get(
            "/api/spaces/mine",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 200
        assert response.json() == []


class TestGetSpace:
    def test_get_space_by_id(self, client, space_owner_token):
        create_response = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(space_owner_token),
        )
        space_id = create_response.json()["id"]

        response = client.get(f"/api/spaces/{space_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == space_id
        assert data["description"] == "Great space"
        assert data["rules"] == "Be respectful"

    def test_get_space_not_found(self, client):
        response = client.get("/api/spaces/nonexistent-id")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


class TestCreateSpace:
    def test_create_space_as_owner(self, client, space_owner_token):
        response = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Loft"
        assert data["location"] == "Via Test, Milano"
        assert data["area_m2"] == 85.0
        assert data["category"] == "Loft"
        assert data["description"] == "Great space"
        assert data["rules"] == "Be respectful"
        assert data["owner_id"]

    def test_create_space_without_auth_returns_401(self, client):
        response = client.post("/api/spaces", json=valid_space_payload())

        assert response.status_code == 401

    def test_create_space_as_regular_user(self, client, regular_user_token):
        response = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 201
        assert response.json()["name"] == "New Loft"

    def test_create_space_invalid_payload_returns_422(self, client, space_owner_token):
        response = client.post(
            "/api/spaces",
            json=valid_space_payload(area_m2=0),
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 422

    def test_create_space_sets_owner_from_token(self, client, space_owner_token):
        me_response = client.get(
            "/api/auth/me", headers=auth_headers(space_owner_token)
        )
        owner_id = me_response.json()["id"]

        response = client.post(
            "/api/spaces",
            json=valid_space_payload(name="Owner Linked Space"),
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 201
        assert response.json()["owner_id"] == owner_id
