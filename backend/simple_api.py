"""
Ultra-simple API for testing - minimal dependencies with in-memory storage
"""
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Simple CORS setup

# In-memory storage for products
products_data = [
    {
        "id": 1,
        "name": "Arduino Uno",
        "description": "Microcontroller board based on ATmega328P",
        "category": "Microcontrollers",
        "product_type": "returnable",
        "total_quantity": 50,
        "available_quantity": 45,
        "unit_price": 25.00,
        "location": "Lab Storage Room A",
        "manufacturer": "Arduino",
        "model_number": "UNO-R3",
        "product_code": "PRD-001",
        "is_active": True,
        "is_lendable": True,
        "max_lending_days": 30
    },
    {
        "id": 2,
        "name": "Raspberry Pi 4",
        "description": "Single board computer with 8GB RAM",
        "category": "Single Board Computers",
        "product_type": "returnable", 
        "total_quantity": 25,
        "available_quantity": 20,
        "unit_price": 85.00,
        "location": "Lab Storage Room A",
        "manufacturer": "Raspberry Pi Foundation",
        "model_number": "Pi4-8GB",
        "product_code": "PRD-002",
        "is_active": True,
        "is_lendable": True,
        "max_lending_days": 14
    }
]

# Counter for generating new product IDs
next_product_id = 3

@app.route('/')
def home():
    return "API is running!"

@app.route('/api/test')
def test():
    return jsonify({"status": "success", "message": "API working!"})

@app.route('/api/products', methods=['GET', 'POST'])
def products():
    global next_product_id
    
    if request.method == 'POST':
        # Get the product data from the request
        product_data = request.get_json()
        
        # Generate product code
        product_code = f"PRD-{next_product_id:03d}"
        
        # Create new product
        new_product = {
            "id": next_product_id,
            "name": product_data.get('name', 'Unnamed Product'),
            "description": product_data.get('description', ''),
            "category": product_data.get('category', 'Uncategorized'),
            "product_type": product_data.get('product_type', 'physical'),
            "total_quantity": product_data.get('total_quantity', 0),
            "available_quantity": product_data.get('available_quantity', 0),
            "unit_price": float(product_data.get('unit_price', 0)),
            "location": product_data.get('location', ''),
            "manufacturer": product_data.get('manufacturer', ''),
            "model_number": product_data.get('model_number', ''),
            "product_code": product_code,
            "is_active": product_data.get('is_active', True),
            "is_lendable": product_data.get('is_lendable', False),
            "max_lending_days": product_data.get('max_lending_days', 30)
        }
        
        # Add to products list
        products_data.append(new_product)
        next_product_id += 1
        
        print(f"✅ Created new product: {new_product['name']} ({product_code})")
        
        return jsonify({
            "status": "success", 
            "message": "Product created successfully", 
            "product_code": product_code,
            "product": new_product
        })
    
    # GET request - return all products (with filtering)
    is_active = request.args.get('is_active')
    filtered_products = products_data
    
    if is_active == 'true':
        filtered_products = [p for p in products_data if p.get('is_active', True)]
    
    return jsonify(filtered_products)

@app.route('/api/products/categories')
def categories():
    # Extract unique categories from current products
    unique_categories = list(set([p['category'] for p in products_data]))
    return jsonify(unique_categories)

@app.route('/api/students')
def students():
    return jsonify([
        {"id": 1, "name": "Alice Johnson", "student_id": "ST001"},
        {"id": 2, "name": "Bob Smith", "student_id": "ST002"}
    ])

@app.route('/api/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'POST':
        return jsonify({"status": "success", "message": "Order created", "id": 123})
    return jsonify([])

@app.route('/api/stats')
def stats():
    return jsonify({
        "total_orders": 10,
        "products_count": 25,
        "students_count": 15
    })

if __name__ == '__main__':
    print("🚀 Simple API Starting on http://localhost:5001")
    app.run(host='127.0.0.1', port=5001, debug=True)
