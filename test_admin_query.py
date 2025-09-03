import psycopg2

conn = psycopg2.connect(
    host='localhost', 
    database='inventory_management', 
    user='postgres', 
    password='gugan@2022', 
    port='5432'
)
cursor = conn.cursor()

# Your exact admin_users_query.sql
query = """
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE role 
            WHEN 'main_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'subadmin' THEN 3
            WHEN 'sub_admin' THEN 3
            ELSE 4
        END, username) as "Sr#",
    
    username as "Username",
    email as "Email Address", 
    UPPER(role) as "Role"

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
    username;
"""

cursor.execute(query)
results = cursor.fetchall()

print('🎯 YOUR admin_users_query.sql RESULTS:')
print('=' * 65)
print(f"{'Sr#':<4} {'Username':<15} {'Email Address':<25} {'Role':<15}")
print('=' * 65)

for row in results:
    print(f"{row[0]:<4} {row[1]:<15} {row[2]:<25} {row[3]:<15}")

print('=' * 65)
print(f'📊 Total admin users found: {len(results)}')
print('✅ SUCCESS: Your query now shows real data from the database!')

cursor.close()
conn.close()
