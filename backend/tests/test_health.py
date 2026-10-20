"""
Tests for GET /health endpoint.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    """Use TestClient as a context manager to ensure proper portal lifecycle."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


def test_health_returns_200(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}"
    )


def test_health_json_structure(client: TestClient):
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "quantum-reality-api"
    assert "version" in data
    assert data["simulation_engine"] == "not_connected"
    assert data["milestone"] == 2


def test_health_content_type(client: TestClient):
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]
