#!/usr/bin/env python3
"""
Execute the all-in-one query to display complete project data
"""

import psycopg2

def run_all_in_one_query():
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres',
            password='gugan@2022'
        )
        
        cur = conn.cursor()
        
        print('🏢 COLLEGE INCUBATION INVENTORY MANAGEMENT SYSTEM')
        print('📊 ALL PROJECT DATA IN ONE VIEW')
        print('=' * 80)
        
        # Comprehensive all-in-one query
        query = """
        SELECT 
            data_type,
            record_id,
            main_info,
            details,
            financial_info,
            status_info,
            priority_level,
            category_group
        FROM (
            -- SYSTEM OVERVIEW
            SELECT 
                'SYSTEM_OVERVIEW' as data_type,
                '001' as record_id,
                'Database Summary' as main_info,
                CONCAT(
                    'Tables: Categories(', (SELECT COUNT(*) FROM categories), '), ',
                    'Products(', (SELECT COUNT(*) FROM products), '), ',
                    'Students(', (SELECT COUNT(*) FROM students), '), ',
                    'Orders(', (SELECT COUNT(*) FROM orders), '), ',
                    'Order Items(', (SELECT COUNT(*) FROM order_items), ')'
                ) as details,
                CONCAT('Total Inventory Value: $', 
                    COALESCE(ROUND((SELECT SUM(quantity_available * unit_price) FROM products WHERE status = 'active'), 2), 0)
                ) as financial_info,
                CONCAT('Active Products: ', (SELECT COUNT(*) FROM products WHERE status = 'active')) as status_info,
                'INFO' as priority_level,
                'A_OVERVIEW' as category_group
            
            UNION ALL
            
            -- CATEGORIES
            SELECT 
                'CATEGORY' as data_type,
                c.id::text as record_id,
                c.name as main_info,
                COALESCE(c.description, 'No description available') as details,
                CONCAT('Products: ', COUNT(p.id)) as financial_info,
                CASE 
                    WHEN COUNT(p.id) = 0 THEN '❌ Empty Category'
                    WHEN COUNT(p.id) < 5 THEN '🟡 Few Products'
                    ELSE '✅ Well Stocked'
                END as status_info,
                CASE WHEN COUNT(p.id) = 0 THEN 'MEDIUM' ELSE 'LOW' END as priority_level,
                'B_CATEGORIES' as category_group
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
            GROUP BY c.id, c.name, c.description
            
            UNION ALL
            
            -- PRODUCTS
            SELECT 
                'PRODUCT' as data_type,
                p.id::text as record_id,
                CONCAT(p.name, ' (', p.sku, ')') as main_info,
                CONCAT(
                    'Category: ', COALESCE(c.name, 'None'), ' | ',
                    'Stock: ', p.quantity_available, '/', p.quantity_total, ' | ',
                    'Location: ', COALESCE(p.location, 'Not specified')
                ) as details,
                CONCAT('Unit Price: $', p.unit_price, ' | Current Value: $', 
                    ROUND(p.quantity_available * p.unit_price, 2)) as financial_info,
                CONCAT(
                    p.status, ' | ',
                    CASE 
                        WHEN p.quantity_available = 0 THEN '🔴 OUT OF STOCK'
                        WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN '🟡 LOW STOCK'
                        ELSE '✅ IN STOCK'
                    END
                ) as status_info,
                CASE 
                    WHEN p.quantity_available = 0 THEN 'CRITICAL'
                    WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN 'HIGH'
                    ELSE 'LOW'
                END as priority_level,
                'C_PRODUCTS' as category_group
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            
            UNION ALL
            
            -- STUDENTS
            SELECT 
                'STUDENT' as data_type,
                s.id::text as record_id,
                s.name as main_info,
                CONCAT(
                    'Email: ', s.email, ' | ',
                    'Department: ', COALESCE(s.department, 'Not specified'), ' | ',
                    'Year: ', COALESCE(s.year_of_study::text, 'Not specified')
                ) as details,
                CONCAT('Total Orders: ', COUNT(o.id), ' | Total Borrowed: $', 
                    COALESCE(ROUND(SUM(o.total_value), 2), 0)) as financial_info,
                CONCAT(
                    CASE WHEN s.is_active THEN '✅ Active' ELSE '❌ Inactive' END, ' | ',
                    CASE 
                        WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 
                        THEN '⚠️ Has Overdue Items'
                        ELSE '✅ No Issues'
                    END
                ) as status_info,
                CASE 
                    WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 THEN 'HIGH'
                    WHEN s.is_active = false THEN 'MEDIUM'
                    ELSE 'LOW'
                END as priority_level,
                'D_STUDENTS' as category_group
            FROM students s
            LEFT JOIN orders o ON s.id = o.student_id
            GROUP BY s.id, s.name, s.email, s.department, s.year_of_study, s.is_active
            
            UNION ALL
            
            -- ORDERS
            SELECT 
                'ORDER' as data_type,
                o.id::text as record_id,
                CONCAT('Order #', o.order_number, ' - ', s.name) as main_info,
                CONCAT(
                    'Student: ', s.name, ' (', COALESCE(s.department, 'No Dept'), ') | ',
                    'Items: ', o.total_items, ' | ',
                    'Status: ', UPPER(o.status)
                ) as details,
                CONCAT('Total Value: $', o.total_value) as financial_info,
                CONCAT(
                    UPPER(o.status), ' | ',
                    CASE 
                        WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE 
                        THEN CONCAT('⚠️ OVERDUE by ', (CURRENT_DATE - o.expected_return_date), ' days')
                        WHEN o.status = 'approved' 
                        THEN CONCAT('📋 Due: ', o.expected_return_date)
                        ELSE '📋 Pending Processing'
                    END
                ) as status_info,
                CASE 
                    WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'CRITICAL'
                    WHEN o.status = 'pending' THEN 'HIGH'
                    WHEN o.status = 'approved' THEN 'MEDIUM'
                    ELSE 'LOW'
                END as priority_level,
                'E_ORDERS' as category_group
            FROM orders o
            JOIN students s ON o.student_id = s.id
            
            UNION ALL
            
            -- ORDER ITEMS SUMMARY
            SELECT 
                'ORDER_ITEM' as data_type,
                oi.id::text as record_id,
                CONCAT(p.name, ' in Order #', o.order_number) as main_info,
                CONCAT(
                    'Product: ', p.name, ' | ',
                    'Requested: ', oi.quantity_requested, ' | ',
                    'Approved: ', oi.quantity_approved, ' | ',
                    'Student: ', s.name
                ) as details,
                CONCAT('Unit: $', oi.unit_price, ' | Total: $', oi.total_price) as financial_info,
                CONCAT(
                    UPPER(oi.status), ' | ',
                    CASE 
                        WHEN oi.quantity_approved < oi.quantity_requested THEN '⚠️ Partial'
                        WHEN oi.quantity_approved = oi.quantity_requested THEN '✅ Full'
                        ELSE '📋 Pending'
                    END
                ) as status_info,
                CASE 
                    WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'HIGH'
                    WHEN oi.status = 'pending' THEN 'MEDIUM'
                    ELSE 'LOW'
                END as priority_level,
                'F_ORDER_ITEMS' as category_group
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN students s ON o.student_id = s.id
            JOIN products p ON oi.product_id = p.id
            
        ) combined_data
        ORDER BY 
            category_group,
            CASE priority_level
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
                WHEN 'INFO' THEN 5
                ELSE 6
            END,
            record_id::integer
        """
        
        cur.execute(query)
        results = cur.fetchall()
        
        current_category = None
        total_records = 0
        
        for row in results:
            category = row[7]  # category_group
            
            # Print category header when it changes
            if category != current_category:
                current_category = category
                category_name = category.split('_')[1] if '_' in category else category
                print(f'\n📋 {category_name}')
                print('=' * 60)
            
            total_records += 1
            
            # Priority icons
            priority_icon = {
                'CRITICAL': '🔴',
                'HIGH': '🟡',
                'MEDIUM': '🟠',
                'LOW': '🟢',
                'INFO': 'ℹ️'
            }.get(row[6], '📋')
            
            print(f'{priority_icon} {row[0]} #{row[1]}')
            print(f'   📌 {row[2]}')
            print(f'   📝 {row[3]}')
            print(f'   💰 {row[4]}')
            print(f'   📊 {row[5]}')
            print(f'   ⚡ Priority: {row[6]}')
            print('-' * 40)
        
        # Summary
        print(f'\n✅ ALL-IN-ONE QUERY COMPLETE')
        print(f'📊 Total Records Displayed: {total_records}')
        print(f'🏷️ Categories: {len(set(r[7] for r in results))}')
        
        # Priority breakdown
        priority_counts = {}
        for row in results:
            priority = row[6]
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        print(f'\n📈 Priority Breakdown:')
        for priority, count in sorted(priority_counts.items()):
            icon = {'CRITICAL': '🔴', 'HIGH': '🟡', 'MEDIUM': '🟠', 'LOW': '🟢', 'INFO': 'ℹ️'}.get(priority, '📋')
            print(f'   {icon} {priority}: {count} items')
        
        print('=' * 80)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f'❌ Error executing all-in-one query: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_in_one_query()
