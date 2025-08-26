#!/usr/bin/env python3
"""
Test the new student update endpoint
"""
import requests
import json

def test_student_update_endpoint():
    """Test that the PUT /students/{id} endpoint works"""
    try:
        print("🧪 Testing Student Update Endpoint")
        print("=" * 40)
        
        # Check API health
        health_response = requests.get("http://localhost:8001/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ API not ready")
            return False
            
        print("✅ API is running")
        
        # Get current students to test with
        students_response = requests.get("http://localhost:8001/students", timeout=5)
        if students_response.status_code != 200:
            print("❌ Cannot fetch students list")
            return False
            
        students = students_response.json()
        if not students:
            print("⚠️  No students found in database")
            
            # Create a test student first
            test_student = {
                "student_id": "TEST001",
                "name": "Emma Wilson", 
                "email": "emma.wilson@test.edu",
                "phone": "123-456-7890",
                "department": "Computer Science",
                "year_of_study": 2,
                "course": "BSc Computer Science"
            }
            
            create_response = requests.post("http://localhost:8001/students", 
                                          json=test_student, timeout=5)
            if create_response.status_code != 200:
                print(f"❌ Failed to create test student: {create_response.text}")
                return False
                
            students = [create_response.json()]
            print(f"✅ Created test student: {students[0]['name']}")
        
        # Test updating the first student
        test_student = students[0]
        student_id = test_student['id']
        
        print(f"🔄 Testing update on student: {test_student.get('name')} (ID: {student_id})")
        
        # Update data (simulating OCR extraction of Sarah Johnson)
        update_data = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@test.edu", 
            "department": "Engineering"
        }
        
        print(f"📝 Updating with: {update_data}")
        
        # Make PUT request to update student
        update_response = requests.put(
            f"http://localhost:8001/students/{student_id}",
            json=update_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"📡 Response status: {update_response.status_code}")
        
        if update_response.status_code == 200:
            updated_student = update_response.json()
            print("✅ Update successful!")
            print(f"   New name: {updated_student.get('name')}")
            print(f"   New email: {updated_student.get('email')}")
            print(f"   New department: {updated_student.get('department')}")
            
            # Verify the update actually worked
            if updated_student.get('name') == 'Sarah Johnson':
                print("🎯 SUCCESS: Student name correctly updated to Sarah Johnson!")
                return True
            else:
                print(f"❌ FAILED: Expected 'Sarah Johnson', got '{updated_student.get('name')}'")
                return False
                
        else:
            print(f"❌ Update failed: {update_response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Student Update API Test")
    success = test_student_update_endpoint()
    
    if success:
        print("\n✅ All tests passed! The Emma Wilson issue should now be fixed.")
        print("📋 Next steps:")
        print("1. Go to http://localhost:3000") 
        print("2. Open Browser DevTools (F12) → Console tab")
        print("3. Upload Sarah's invoice image")
        print("4. Watch for: '✅ Updated student record with OCR data: Sarah Johnson'")
        print("5. Verify invoice shows 'Sarah Johnson' not 'Emma Wilson'")
    else:
        print("\n❌ Tests failed. Check the API logs for more details.")
