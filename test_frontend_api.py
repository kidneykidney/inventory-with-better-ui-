import requests
import json

# Test the actual API that your frontend uses
try:
    print("🔍 Testing Frontend API Endpoints...")
    
    # Test the users endpoint that your frontend calls
    response = requests.get("http://localhost:8000/api/auth/users")
    print(f"📡 API Response Status: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"👥 Users from API (what frontend sees): {len(users)}")
        
        for i, user in enumerate(users, 1):
            print(f"   {i}. {user.get('username', 'N/A')} ({user.get('email', 'N/A')}) - {user.get('role', 'N/A')}")
            
        print("\n📋 Full API Response:")
        print(json.dumps(users, indent=2))
    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("💡 Make sure your server is running on http://localhost:8000")
