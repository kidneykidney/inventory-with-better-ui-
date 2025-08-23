#!/usr/bin/env python3

import requests
import json
import uuid

# Test the exact data from the form with a unique SKU
unique_sku = f"TEST-{str(uuid.uuid4())[:8].upper()}"

test_product = {
    'name': 'gugan',
    'sku': unique_sku,
    'description': '',
    'category_id': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  # Educational Kits
    'quantity_total': 45,
    'quantity_available': 10000,
    'is_returnable': True,
    'unit_price': 0,
    'location': '534',
    'minimum_stock_level': 0,
    'image_url': 'https://tse2.mm.bing.net',
    'specifications': {},
    'tags': []
}

print("Testing product creation...")
print("Data being sent:", json.dumps(test_product, indent=2))

try:
    response = requests.post('http://localhost:8000/products', json=test_product)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 201:
        data = response.json()
        print("✅ Product created successfully!")
        print(f"Product ID: {data.get('id', 'unknown')}")
        print(f"Product Name: {data.get('name', 'unknown')}")
        print(f"Product SKU: {data.get('sku', 'unknown')}")
    else:
        print("❌ Error occurred:")
        print(f"Response Text: {response.text}")
        
        try:
            error_data = response.json()
            print(f"Error Detail: {error_data.get('detail', 'Unknown error')}")
        except:
            print("Could not parse error response as JSON")
            
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Could not connect to API server")
    print("Make sure the API server is running on localhost:8000")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
