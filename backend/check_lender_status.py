from database_manager import DatabaseManager

try:
    db = DatabaseManager()
    db.connect()
    
    # Check lenders active status
    result = db.execute_query('SELECT name, is_active FROM lenders LIMIT 5')
    print('Lenders in database:')
    for row in result:
        status = "Active" if row["is_active"] else "Inactive" 
        print(f'  - {row["name"]}: {status}')
    
    # Check how many are active vs inactive
    active_count = db.execute_query('SELECT COUNT(*) as count FROM lenders WHERE is_active = true')
    inactive_count = db.execute_query('SELECT COUNT(*) as count FROM lenders WHERE is_active = false OR is_active IS NULL')
    
    print(f'\nActive lenders: {active_count[0]["count"]}')
    print(f'Inactive lenders: {inactive_count[0]["count"]}')
    
    db.disconnect()
    
except Exception as e:
    print(f'Error: {e}')