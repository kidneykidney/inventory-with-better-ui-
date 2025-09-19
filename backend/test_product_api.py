#!/usr/bin/env python3

import requests
import json

def test_product_creation():
    """Test product creation API"""
    
    # Test data
    product_data = {
        "name": "Test Product",
        "description": "Test product description",
        "category_id": None,
        "sku": "TEST001",
        "quantity_total": 10,
        "quantity_available": 10,
        "is_returnable": True,
        "unit_price": 25.99,
        "location": "Storage Room A",
        "minimum_stock_level": 5,
        "date_of_purchase": "2025-09-19"
    }
    
    try:
        # Test API endpoint
        response = requests.post(
            "http://localhost:8000/api/products",
            json=product_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Product creation successful!")
            return True
        else:
            print("❌ Product creation failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server. Make sure it's running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_product_creation()