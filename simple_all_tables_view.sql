    -- =========================================
    -- SIMPLE ALL TABLES VIEW - CLEAN FORMAT
    -- Copy and paste this into pgAdmin Query Editor
    -- =========================================

    -- 📊 SYSTEM OVERVIEW
    SELECT 
        'SYSTEM_OVERVIEW' as table_type,
        'Database Summary' as name,
        CONCAT('Categories: ', (SELECT COUNT(*) FROM categories)) as info1,
        CONCAT('Products: ', (SELECT COUNT(*) FROM products)) as info2,
        CONCAT('Students: ', (SELECT COUNT(*) FROM students)) as info3,
        CONCAT('Orders: ', (SELECT COUNT(*) FROM orders)) as info4,
        CONCAT('Total Inventory Value: $', COALESCE((SELECT ROUND(SUM(quantity_available * unit_price), 2) FROM products WHERE status = 'active'), 0)) as financial_info,
        1 as sort_order

    UNION ALL

    -- 🏷️ CATEGORIES
    SELECT 
        'CATEGORY' as table_type,
        c.name,
        COALESCE(c.description, 'No description') as info1,
        CONCAT('Products: ', COUNT(p.id)) as info2,
        CONCAT('Total Value: $', COALESCE(ROUND(SUM(p.quantity_available * p.unit_price), 2), 0)) as info3,
        c.created_at::text as info4,
        CASE WHEN COUNT(p.id) = 0 THEN '❌ Empty' ELSE '✅ Active' END as financial_info,
        2 as sort_order
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    GROUP BY c.id, c.name, c.description, c.created_at

    UNION ALL

    -- 📦 PRODUCTS
    SELECT 
        'PRODUCT' as table_type,
        p.name,
        CONCAT('SKU: ', p.sku) as info1,
        CONCAT('Category: ', COALESCE(c.name, 'None')) as info2,
        CONCAT('Stock: ', p.quantity_available, '/', p.quantity_total) as info3,
        CONCAT('Location: ', COALESCE(p.location, 'Not set')) as info4,
        CONCAT('$', p.unit_price, ' | Total: $', ROUND(p.quantity_available * p.unit_price, 2)) as financial_info,
        3 as sort_order
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id

    UNION ALL

    -- 👥 STUDENTS
    SELECT 
        'STUDENT' as table_type,
        s.name,
        s.email as info1,
        COALESCE(s.department, 'No department') as info2,
        CONCAT('Year: ', COALESCE(s.year_of_study::text, 'Not set')) as info3,
        CASE WHEN s.is_active THEN '✅ Active' ELSE '❌ Inactive' END as info4,
        CONCAT('Orders: ', COUNT(o.id), ' | Value: $', COALESCE(ROUND(SUM(o.total_value), 2), 0)) as financial_info,
        4 as sort_order
    FROM students s
    LEFT JOIN orders o ON s.id = o.student_id
    GROUP BY s.id, s.name, s.email, s.department, s.year_of_study, s.is_active

    UNION ALL

    -- 📋 ORDERS
    SELECT 
        'ORDER' as table_type,
        CONCAT('Order #', o.order_number),
        s.name as info1,
        CONCAT('Status: ', UPPER(o.status)) as info2,
        CONCAT('Items: ', o.total_items) as info3,
        CONCAT('Requested: ', o.requested_date::date) as info4,
        CONCAT('$', o.total_value, 
            CASE 
                WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE 
                THEN ' | ⚠️ OVERDUE'
                ELSE ''
            END) as financial_info,
        5 as sort_order
    FROM orders o
    JOIN students s ON o.student_id = s.id

    UNION ALL

    -- 🛒 ORDER ITEMS
    SELECT 
        'ORDER_ITEM' as table_type,
        p.name,
        CONCAT('Order #', o.order_number) as info1,
        s.name as info2,
        CONCAT('Requested: ', oi.quantity_requested, ' | Approved: ', COALESCE(oi.quantity_approved, 0)) as info3,
        CONCAT('Status: ', UPPER(oi.status)) as info4,
        CONCAT('$', oi.unit_price, ' x ', oi.quantity_requested, ' = $', oi.total_price) as financial_info,
        6 as sort_order
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN students s ON o.student_id = s.id
    JOIN products p ON oi.product_id = p.id

    ORDER BY sort_order, name;

    -- =========================================
    -- RESULT COLUMNS:
    -- table_type: Which table the data comes from
    -- name: Main identifier (category name, product name, student name, etc.)
    -- info1: First piece of detailed information
    -- info2: Second piece of detailed information  
    -- info3: Third piece of detailed information
    -- info4: Fourth piece of detailed information
    -- financial_info: Money-related information or status
    -- =========================================
