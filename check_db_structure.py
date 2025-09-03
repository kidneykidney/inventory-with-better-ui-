import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost', 
        database='inventory_management', 
        user='postgres', 
        password='gugan@2022', 
        port='5432'
    )
    cursor = conn.cursor()
    
    # Check table structure
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    print('📋 Users table structure:')
    print('=' * 50)
    for col, dtype, nullable in columns:
        nullable_str = 'NULL' if nullable == 'YES' else 'NOT NULL'
        print(f'   {col:<20} {dtype:<15} {nullable_str}')
    
    # Test insert with proper structure
    print('\n🧪 Testing user insert...')
    
    # First, let's see what's currently in the table
    cursor.execute("SELECT username, email, role FROM users")
    current_users = cursor.fetchall()
    print(f'\n📊 Current users in database: {len(current_users)}')
    for user in current_users:
        print(f'   {user[0]} ({user[1]}) - {user[2]}')
    
    cursor.close()
    conn.close()
    print('\n✅ Database connection working!')
    
except Exception as e:
    print(f'❌ Database error: {e}')
