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
    cursor.execute("SELECT username, email, role FROM users WHERE role LIKE '%admin%' ORDER BY role, username")
    users = cursor.fetchall()
    print('🔍 Current users in PostgreSQL database:')
    for i, (username, email, role) in enumerate(users, 1):
        print(f'   {i}. {username} ({email}) - {role}')
    print(f'📊 Total admin users: {len(users)}')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'❌ Database check failed: {e}')
