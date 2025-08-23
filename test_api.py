import requests
import time

def test_api_endpoints():
    """Test API endpoints to identify issues"""
    base_url = "http://localhost:8000"
    
    # Wait a moment for server to be ready
    time.sleep(2)
    
    endpoints = [
        "/health",
        "/products?status=active",
        "/students", 
        "/orders"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"Items found: {len(data)}")
                else:
                    print("Response OK")
            else:
                print(f"Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Connection error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_api_endpoints()
