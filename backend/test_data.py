import requests

# Test API connection
response = requests.get('http://localhost:8000/health')
print(f'Health check: {response.json()}')

# Get existing products
response = requests.get('http://localhost:8000/products')
if response.status_code == 200:
    products = response.json()
    print(f'Found {len(products)} products:')
    for product in products[:3]:
        print(f'- {product["name"]}: {product["quantity_available"]} available')
        
# Get existing categories
response = requests.get('http://localhost:8000/categories')
if response.status_code == 200:
    categories = response.json()
    print(f'\nFound {len(categories)} categories:')
    for category in categories:
        print(f'- {category["name"]}')
        
# Get existing students
response = requests.get('http://localhost:8000/students')
if response.status_code == 200:
    students = response.json()
    print(f'\nFound {len(students)} students:')
    for student in students:
        print(f'- {student["name"]} ({student["student_id"]})')
