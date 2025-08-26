import requests
import json
import sys

try:
    print("🧪 Testing API Health...")
    
    # Test 1: Basic connectivity
    response = requests.get('http://localhost:8000/health', timeout=10)
    print(f"✅ Health endpoint: {response.status_code}")
    
    # Test 2: Students endpoint
    response = requests.get('http://localhost:8000/students', timeout=10)
    print(f"📚 Students endpoint: {response.status_code}")
    
    if response.status_code == 200:
        students = response.json()
        print(f"✅ Database connection working! Found {len(students)} students")
        if students:
            print(f"📋 First student: {students[0].get('name', 'Unknown')}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
    
    # Test 3: Categories endpoint
    response = requests.get('http://localhost:8000/categories', timeout=10)
    print(f"🏷️  Categories endpoint: {response.status_code}")
    
    # Test 4: Products endpoint  
    response = requests.get('http://localhost:8000/products', timeout=10)
    print(f"📦 Products endpoint: {response.status_code}")
    
    # Test 5: Invoices endpoint
    response = requests.get('http://localhost:8000/invoices', timeout=10)
    print(f"🧾 Invoices endpoint: {response.status_code}")
    
    print("🎉 API testing completed!")
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: Cannot connect to API server")
    print(f"   Make sure the server is running on http://localhost:8000")
    print(f"   Error details: {e}")
except requests.exceptions.Timeout as e:
    print(f"❌ Timeout Error: API server not responding")
    print(f"   Error details: {e}")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    import traceback
    traceback.print_exc()

print("\nPress Enter to continue...")
input()
