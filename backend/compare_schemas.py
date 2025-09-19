import psycopg2

def check_products_schema(db_name):
    try:
        conn = psycopg2.connect(
            host='localhost', 
            database=db_name, 
            user='postgres', 
            password='gugan@2022'
        )
        cur = conn.cursor()
        
        print(f"\n=== {db_name} Products Schema ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        for col_name, col_type in columns:
            print(f"  {col_name}: {col_type}")
            
        # Get some actual data
        cur.execute("SELECT * FROM products LIMIT 2")
        products = cur.fetchall()
        print(f"\nSample data ({len(products)} rows):")
        for i, product in enumerate(products):
            print(f"  Row {i+1}: {product}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

check_products_schema('inventory_db')
check_products_schema('inventory_management')