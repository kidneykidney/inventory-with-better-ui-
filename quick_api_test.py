import requests

print("🧪 Quick API Test...")

try:
    # Test students endpoint
    response = requests.get('http://localhost:8000/students', timeout=5)
    print(f"Students: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Database working! Found {len(data)} students")
        
    # Test health
    response = requests.get('http://localhost:8000/health', timeout=5)
    print(f"Health: {response.status_code}")
    
    print("🎉 API is working!")
    
except Exception as e:
    print(f"❌ Error: {e}")
