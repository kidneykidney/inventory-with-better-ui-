#!/usr/bin/env python3

import sys
import asyncio
from inventory_api import app
from fastapi.testclient import TestClient

def test_endpoints():
    """Test basic endpoints"""
    client = TestClient(app)
    
    # Test health endpoint
    try:
        response = client.get("/health")
        print(f"Health endpoint: {response.status_code}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    # Test students endpoint
    try:
        response = client.get("/students")
        print(f"Students endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} students")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Students endpoint error: {e}")

    # Test students by student ID endpoint
    try:
        response = client.get("/students/by-student-id/STU12345")
        print(f"Students by ID endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found student: {data}")
        elif response.status_code == 404:
            print("Student not found (this is normal)")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Students by ID endpoint error: {e}")

if __name__ == "__main__":
    test_endpoints()
