"""Backend health endpoint tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_API_URL', 'http://localhost:8001').rstrip('/')

class TestHealth:
    """Health check endpoint tests"""

    def test_health_endpoint_returns_200(self):
        """Test health endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✓ Health endpoint returned 200")

    def test_health_endpoint_returns_json(self):
        """Test health endpoint returns valid JSON"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Health endpoint returned valid JSON: {data}")

    def test_health_endpoint_has_required_fields(self):
        """Test health endpoint has required fields"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data, "Missing 'status' field"
        assert "service" in data, "Missing 'service' field"
        assert "timestamp" in data, "Missing 'timestamp' field"
        
        assert data["status"] == "healthy", f"Expected status 'healthy', got '{data['status']}'"
        assert data["service"] == "GRIND Tracker API", f"Expected service 'GRIND Tracker API', got '{data['service']}'"
        
        print(f"✓ Health endpoint has all required fields with correct values")
