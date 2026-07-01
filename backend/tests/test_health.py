"""Smoke tests for application health endpoints."""


class TestHealthEndpoints:
    def test_root(self, client):
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert data["docs"] == "/docs"

    def test_health(self, client):
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
