#!/usr/bin/env python3
"""
Test script to demonstrate logging capabilities
Run this to see logging in action with your inventory system
"""

import requests
import time
import json
from datetime import datetime

def test_api_with_logging():
    """Test various API endpoints to generate log entries"""
    
    base_url = "http://localhost:8000"
    
    print("🔍 Testing Inventory API Logging System")
    print("=" * 50)
    
    tests = [
        {
            "name": "Health Check",
            "method": "GET",
            "url": f"{base_url}/health"
        },
        {
            "name": "List Categories", 
            "method": "GET",
            "url": f"{base_url}/categories"
        },
        {
            "name": "List Products",
            "method": "GET", 
            "url": f"{base_url}/products"
        },
        {
            "name": "List Students",
            "method": "GET",
            "url": f"{base_url}/students"
        },
        {
            "name": "List Orders",
            "method": "GET",
            "url": f"{base_url}/orders"
        },
        {
            "name": "Invalid Endpoint (404)",
            "method": "GET",
            "url": f"{base_url}/nonexistent"
        }
    ]
    
    for test in tests:
        print(f"\n🚀 Testing: {test['name']}")
        print(f"   {test['method']} {test['url']}")
        
        try:
            start_time = time.time()
            
            if test['method'] == 'GET':
                response = requests.get(test['url'], timeout=10)
            elif test['method'] == 'POST':
                response = requests.post(test['url'], json=test.get('data', {}), timeout=10)
            
            duration = (time.time() - start_time) * 1000
            
            print(f"   ✅ Status: {response.status_code}")
            print(f"   ⏱️  Duration: {duration:.2f}ms")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   📊 Results: {len(data)} items")
                    else:
                        print(f"   📊 Response: {type(data).__name__}")
                except:
                    print(f"   📊 Response: {len(response.text)} chars")
            
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection Error - Is your API running?")
            print("   💡 Start your API: cd backend && python inventory_api.py")
            break
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    print("\n" + "=" * 50)
    print("✅ Logging test completed!")
    print("\n📁 Check these files for logs:")
    print("   - logs/inventory_system.log (All logs)")
    print("   - logs/inventory_api.log (API requests)")  
    print("   - logs/inventory_errors.log (Errors only)")
    print("\n🌐 View logs in browser:")
    print("   - Open: backend/log_viewer.html")

def simulate_user_activity():
    """Simulate realistic user activity to generate meaningful logs"""
    
    base_url = "http://localhost:8000"
    
    print("\n🎭 Simulating User Activity...")
    print("This will generate realistic log entries")
    
    activities = [
        "User checking dashboard",
        "Browsing product catalog", 
        "Searching for specific item",
        "Student registration attempt",
        "Order creation process",
        "Inventory level check"
    ]
    
    for i, activity in enumerate(activities, 1):
        print(f"\n{i}/6 {activity}...")
        
        # Different request patterns for each activity
        if "dashboard" in activity:
            requests.get(f"{base_url}/categories")
            requests.get(f"{base_url}/products")
            requests.get(f"{base_url}/orders")
            
        elif "product" in activity:
            response = requests.get(f"{base_url}/products")
            if response.status_code == 200:
                products = response.json()
                if products:
                    # Get details of first product
                    requests.get(f"{base_url}/products/{products[0]['id']}")
        
        elif "search" in activity:
            requests.get(f"{base_url}/products?search=arduino")
            
        elif "student" in activity:
            # This might fail if student already exists - that's OK for testing
            student_data = {
                "student_id": "TEST123",
                "name": "Test Student",
                "email": "test@student.com",
                "department": "Computer Science",
                "year_of_study": 2
            }
            requests.post(f"{base_url}/students", json=student_data)
        
        time.sleep(1)  # Realistic delay between actions
    
    print("\n✅ User activity simulation completed!")
    print("Check your log files to see all the generated entries.")

if __name__ == "__main__":
    print("🔍 Inventory System - Logging Test")
    print("=" * 50)
    
    choice = input("\nChoose test type:\n1. Basic API Test\n2. Simulate User Activity\n3. Both\n\nEnter choice (1-3): ")
    
    if choice in ['1', '3']:
        test_api_with_logging()
    
    if choice in ['2', '3']:
        simulate_user_activity()
    
    print("\n🎯 Next Steps:")
    print("1. Check log files in the logs/ directory")
    print("2. Open log_viewer.html in your browser")
    print("3. Monitor real-time logs while using your React app")
    print("4. Set up log monitoring in production")
