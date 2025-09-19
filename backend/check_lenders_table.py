from database_manager import DatabaseManager

try:
    db = DatabaseManager()
    db.connect()
    
    # Check lenders table structure
    result = db.execute_query("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lenders' 
        ORDER BY ordinal_position
    """)
    
    print('Lenders table structure:')
    for row in result:
        print(f'  {row["column_name"]}: {row["data_type"]} (nullable: {row["is_nullable"]})')
    
    # Check if table has any data
    count_result = db.execute_query("SELECT COUNT(*) as count FROM lenders")
    print(f'\nLenders count: {count_result[0]["count"]}')
    
    db.disconnect()
    
except Exception as e:
    print(f'Error: {e}')