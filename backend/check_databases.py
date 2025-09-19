import psycopg2

def check_database(db_name):
    try:
        conn = psycopg2.connect(
            host='localhost', 
            database=db_name, 
            user='postgres', 
            password='gugan@2022'
        )
        cur = conn.cursor()
        
        # Get tables
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [row[0] for row in cur.fetchall()]
        
        print(f"\n=== Database: {db_name} ===")
        print(f"Tables: {tables}")
        
        # Check products table if it exists
        if 'products' in tables:
            cur.execute("SELECT COUNT(*) FROM products")
            product_count = cur.fetchone()[0]
            print(f"Products count: {product_count}")
            
            if product_count > 0:
                cur.execute("SELECT name, sku, stock FROM products LIMIT 3")
                sample_products = cur.fetchall()
                print("Sample products:")
                for product in sample_products:
                    print(f"  - {product[0]} (SKU: {product[1]}, Stock: {product[2]})")
        
        # Check students table if it exists
        if 'students' in tables:
            cur.execute("SELECT COUNT(*) FROM students")
            student_count = cur.fetchone()[0]
            print(f"Students count: {student_count}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error checking {db_name}: {e}")

# Check both databases
check_database('inventory_db')
check_database('inventory_management')