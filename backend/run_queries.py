#!/usr/bin/env python3

import psycopg2

print('Testing PostgreSQL connection and running COUNT queries...')

try:
    conn = psycopg2.connect(
        host='localhost',
        database='inventory_management',
        user='postgres',
        password='gugan@2022'
    )
    
    cur = conn.cursor()
    
    # Run your exact queries from pgAdmin
    print('=== RUNNING YOUR COUNT QUERIES ===')
    
    cur.execute('SELECT COUNT(*) as total_products FROM products')
    products_count = cur.fetchone()[0]
    print(f'Total products: {products_count}')
    
    cur.execute('SELECT COUNT(*) as total_students FROM students')
    students_count = cur.fetchone()[0] 
    print(f'Total students: {students_count}')
    
    cur.execute('SELECT COUNT(*) as total_orders FROM orders')
    orders_count = cur.fetchone()[0]
    print(f'Total orders: {orders_count}')
    
    cur.execute('SELECT COUNT(*) as total_order_items FROM order_items')
    items_count = cur.fetchone()[0]
    print(f'Total order items: {items_count}')
    
    print('\n=== ADDITIONAL HELPFUL QUERIES ===')
    
    # Show some actual data
    cur.execute('SELECT name, sku, quantity_available FROM products LIMIT 3')
    products = cur.fetchall()
    print('\nFirst 3 products:')
    for product in products:
        print(f'  - {product[0]} (SKU: {product[1]}) - Available: {product[2]}')
    
    cur.execute('SELECT name, email, department FROM students LIMIT 3')  
    students = cur.fetchall()
    print('\nFirst 3 students:')
    for student in students:
        print(f'  - {student[0]} ({student[1]}) - {student[2]}')
    
    cur.execute('SELECT status, COUNT(*) FROM orders GROUP BY status')
    order_stats = cur.fetchall()
    print('\nOrders by status:')
    for stat in order_stats:
        print(f'  - {stat[0]}: {stat[1]} orders')
    
    cur.close()
    conn.close()
    print('\n✅ All queries executed successfully!')
    
except Exception as e:
    print(f'❌ Connection failed: {e}')
