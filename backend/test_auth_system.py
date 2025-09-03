"""
Test Authentication API
Simple test to verify authentication endpoints are working
"""

import requests
import json

def test_auth_api():
    """Test the authentication API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🔍 Testing Authentication API...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/api/auth/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check: PASSED")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check: FAILED (Error: {e})")
        return False
    
    # Test 2: Try to access protected endpoint (should fail without auth)
    try:
        response = requests.get(f"{base_url}/api/auth/me", timeout=5)
        if response.status_code == 401:
            print("✅ Protected endpoint: PASSED (correctly requires authentication)")
        else:
            print(f"⚠️  Protected endpoint: Status {response.status_code} (expected 401)")
    except requests.exceptions.RequestException as e:
        print(f"❌ Protected endpoint test: FAILED (Error: {e})")
    
    # Test 3: Try login with default credentials
    try:
        login_data = {
            "username": "admin",
            "password": "College@2025",
            "remember_me": False
        }
        response = requests.post(
            f"{base_url}/api/auth/login", 
            json=login_data,
            timeout=5
        )
        if response.status_code == 200:
            print("✅ Login test: PASSED")
            token_data = response.json()
            print(f"   Access token received: {token_data.get('access_token', 'N/A')[:20]}...")
            return True
        else:
            print(f"❌ Login test: FAILED (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Login test: FAILED (Error: {e})")
        return False

def test_regular_api():
    """Test that regular API endpoints are still working"""
    base_url = "http://localhost:8000"
    
    print("\n🔍 Testing Regular API endpoints...")
    
    try:
        response = requests.get(f"{base_url}/products", timeout=5)
        if response.status_code == 200:
            print("✅ Products endpoint: PASSED")
            return True
        else:
            print(f"❌ Products endpoint: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Products endpoint: FAILED (Error: {e})")
        return False

if __name__ == "__main__":
    print("🚀 Starting API Tests...")
    print("=" * 50)
    
    # Test if server is running
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        print("✅ Backend server is running")
    except:
        print("❌ Backend server is not responding")
        print("   Please start the backend server first")
        exit(1)
    
    # Test authentication
    auth_success = test_auth_api()
    
    # Test regular API
    api_success = test_regular_api()
    
    print("\n" + "=" * 50)
    if auth_success and api_success:
        print("🎉 All tests PASSED! Authentication system is working!")
    else:
        print("❌ Some tests FAILED. Check the output above for details.")
