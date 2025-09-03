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

    # Your exact admin_users_query.sql
    cursor.execute("""
    SELECT 
        ROW_NUMBER() OVER (ORDER BY 
            CASE role 
                WHEN 'main_admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'subadmin' THEN 3
                WHEN 'sub_admin' THEN 3
                ELSE 4
            END, username) as sr_num,
        username,
        email, 
        UPPER(role) as role
    FROM users 
    WHERE role LIKE '%admin%'
       OR role IN ('main_admin', 'admin', 'subadmin', 'sub_admin')
    ORDER BY 
        CASE role 
            WHEN 'main_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'subadmin' THEN 3
            WHEN 'sub_admin' THEN 3
            ELSE 4
        END,
        username
    """)
    
    results = cursor.fetchall()
    
    print('🎯 CURRENT admin_users_query.sql RESULTS:')
    print('=' * 65)
    print(f"{'Sr#':<4} {'Username':<15} {'Email Address':<25} {'Role':<15}")
    print('=' * 65)
    
    for row in results:
        print(f"{row[0]:<4} {row[1]:<15} {row[2]:<25} {row[3]:<15}")
    
    print('=' * 65)
    print(f'📊 Total admin users: {len(results)}')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'❌ Error: {e}')
