from database_manager import DatabaseManager

try:
    db = DatabaseManager()
    db.connect()
    
    # Check orders table
    try:
        result = db.execute_query('SELECT COUNT(*) as count FROM orders')
        print(f'Orders table: {result[0]["count"]} records')
    except Exception as e:
        print(f'Orders table error: {e}')
    
    # Check invoices table  
    try:
        result2 = db.execute_query('SELECT COUNT(*) as count FROM invoices')
        print(f'Invoices table: {result2[0]["count"]} records')
    except Exception as e:
        print(f'Invoices table error: {e}')
        
    # Check what tables exist
    tables = db.execute_query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    print(f'\nAll tables in database:')
    for table in tables:
        print(f'  - {table["table_name"]}')
        
    db.disconnect()
    
except Exception as e:
    print(f'Database error: {e}')