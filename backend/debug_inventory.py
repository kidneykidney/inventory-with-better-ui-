from database_manager import DatabaseManager

db = DatabaseManager()
db.connect()

print("=== INVENTORY VALUE DEBUG ===")

# First check total products vs active products
total_count = db.execute_query("SELECT COUNT(*) as count FROM products")
active_count = db.execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'")

print(f"Total products: {total_count[0]['count']}")
print(f"Active products: {active_count[0]['count']}")

# Get all products (not just active) to see what's there
all_products = db.execute_query("""
    SELECT name, unit_price, quantity_available, quantity_total, status
    FROM products 
    ORDER BY unit_price DESC
    LIMIT 10
""")

print("\nAll products (top 10):")
for product in all_products:
    print(f"  {product['name']}: price=${product['unit_price']}, qty_total={product['quantity_total']}, status={product['status']}")

# Get all products with prices
result = db.execute_query("""
    SELECT name, unit_price, quantity_available, quantity_total, 
           (quantity_total * unit_price) as total_value,
           (quantity_available * unit_price) as available_value
    FROM products 
    WHERE status = 'active'
    ORDER BY unit_price DESC
""")

print(f"Found {len(result)} active products")

total_inventory_value = 0
total_available_value = 0

for product in result:
    total_value = float(product['total_value']) if product['total_value'] else 0
    available_value = float(product['available_value']) if product['available_value'] else 0
    
    total_inventory_value += total_value
    total_available_value += available_value
    
    if product['unit_price'] > 0:
        print(f"Product: {product['name']}")
        print(f"  Price: ${product['unit_price']}")
        print(f"  Qty Total: {product['quantity_total']}")
        print(f"  Qty Available: {product['quantity_available']}")
        print(f"  Total Value: ${total_value}")
        print(f"  Available Value: ${available_value}")
        print("---")

print(f"\nSUMMARY:")
print(f"Total Inventory Value (using quantity_total): ${total_inventory_value:,.2f}")
print(f"Available Inventory Value (using quantity_available): ${total_available_value:,.2f}")

# Test the API calculation
api_result = db.execute_query("SELECT SUM(quantity_available * unit_price) as total FROM products WHERE status = 'active'")
api_value = float(api_result[0]['total']) if api_result and api_result[0]['total'] else 0.0

print(f"Current API calculation: ${api_value:,.2f}")
