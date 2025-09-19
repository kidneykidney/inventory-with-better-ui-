import requests

def test_api_endpoint(endpoint_name, url):
    try:
        print(f"\n=== Testing {endpoint_name} ===")
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Data type: {type(data)}")
            if isinstance(data, list):
                print(f"Count: {len(data)}")
                if len(data) > 0:
                    print(f"Sample item: {data[0]}")
            else:
                print(f"Data: {data}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

# Test all main endpoints
test_api_endpoint("Products", "http://localhost:8000/api/products")
test_api_endpoint("Students", "http://localhost:8000/api/students")
test_api_endpoint("Categories", "http://localhost:8000/api/categories")