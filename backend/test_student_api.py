import requests
import json

# Test data that matches the frontend form
test_student = {
    "student_id": "TEST001",
    "name": "Test Student",
    "email": "test@example.com", 
    "phone": "1234567890",
    "year_of_study": 1,
    "course": "Computer Science"
}

print("Testing student creation API...")
print(f"Data to send: {json.dumps(test_student, indent=2)}")

try:
    # Make POST request to create student
    response = requests.post(
        "http://localhost:8000/api/students",
        json=test_student,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("✅ Success!")
        print(f"Response Data: {response.json()}")
    else:
        print("❌ Error occurred")
        print(f"Response Text: {response.text}")
        
        # Try to parse error as JSON
        try:
            error_data = response.json()
            print(f"Error Details: {json.dumps(error_data, indent=2)}")
        except:
            print("Could not parse error response as JSON")

except requests.exceptions.ConnectionError:
    print("❌ Could not connect to backend server. Make sure it's running on localhost:8000")
except Exception as e:
    print(f"❌ Unexpected error: {e}")