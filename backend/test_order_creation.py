import requests
import json

# Test data that matches what you're entering in the UI
test_order = {
    'student_id': 'dddddddd-dddd-dddd-dddd-dddddddddddd',  # John Doe's ID
    'expected_return_date': '2025-08-24',
    'notes': 'hkwhw',
    'items': [
        {
            'product_id': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',  # joiosd product ID
            'quantity_requested': 1,
            'expected_return_date': '2025-08-24',
            'notes': ''
        }
    ]
}

try:
    response = requests.post('http://localhost:8000/orders', json=test_order)
    print(f'Status: {response.status_code}')
    if response.status_code == 201:
        data = response.json()
        print(f'Order created successfully!')
        print(f'Order ID: {data.get("id", "unknown")[:8]}...')
        print(f'Total Value: ${data.get("total_value", 0)}')
    else:
        print(f'Error: {response.status_code}')
        print(f'Details: {response.text}')
except Exception as e:
    print(f'Error: {e}')
