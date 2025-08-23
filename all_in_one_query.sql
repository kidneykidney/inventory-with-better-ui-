-- =========================================
-- ALL-IN-ONE COMPREHENSIVE PROJECT DATA QUERY
-- College Incubation Inventory Management System
-- =========================================
-- This single query provides a complete overview of all project data
-- organized by data type with standardized columns for easy analysis

SELECT 
    -- Data classification and identification
    data_type,
    record_id,
    main_info,
    details,
    financial_info,
    status_info,
    date_info,
    additional_info,
    
    -- Calculated fields for analysis
    priority_level,
    category_group

FROM (
    -- 📊 SYSTEM OVERVIEW
    SELECT 
        'SYSTEM_OVERVIEW' as data_type,
        '001' as record_id,
        'Database Tables Summary' as main_info,
        CONCAT(
            'Categories: ', (SELECT COUNT(*) FROM categories), ' | ',
            'Products: ', (SELECT COUNT(*) FROM products), ' | ',
            'Students: ', (SELECT COUNT(*) FROM students), ' | ',
            'Orders: ', (SELECT COUNT(*) FROM orders), ' | ',
            'Order Items: ', (SELECT COUNT(*) FROM order_items)
        ) as details,
        CONCAT('Total Inventory Value: $', 
            ROUND(COALESCE((SELECT SUM(quantity_available * unit_price) FROM products WHERE status = 'active'), 0), 2)
        ) as financial_info,
        CONCAT('Active Products: ', (SELECT COUNT(*) FROM products WHERE status = 'active')) as status_info,
        CURRENT_DATE as date_info,
        'Complete system statistics' as additional_info,
        'INFO' as priority_level,
        'OVERVIEW' as category_group

    UNION ALL

    -- 🏷️ CATEGORIES DATA
    SELECT 
        'CATEGORY' as data_type,
        LPAD(c.id::text, 3, '0') as record_id,
        c.name as main_info,
        COALESCE(c.description, 'No description available') as details,
        CONCAT('Products: ', COUNT(p.id), ' | Avg Price: $', 
            COALESCE(ROUND(AVG(p.unit_price), 2), 0)) as financial_info,
        CASE 
            WHEN COUNT(p.id) = 0 THEN '❌ Empty Category'
            WHEN COUNT(p.id) < 5 THEN '🟡 Few Products'
            ELSE '✅ Well Stocked'
        END as status_info,
        c.created_at::date as date_info,
        CONCAT('Total Category Value: $', 
            COALESCE(ROUND(SUM(p.quantity_available * p.unit_price), 2), 0)) as additional_info,
        CASE 
            WHEN COUNT(p.id) = 0 THEN 'HIGH'
            WHEN COUNT(p.id) < 3 THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'CATEGORY' as category_group
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    GROUP BY c.id, c.name, c.description, c.created_at

    UNION ALL

    -- 📦 PRODUCTS DATA
    SELECT 
        'PRODUCT' as data_type,
        LPAD(p.id::text, 3, '0') as record_id,
        CONCAT(p.name, ' (SKU: ', p.sku, ')') as main_info,
        CONCAT(
            'Category: ', COALESCE(c.name, 'Uncategorized'), ' | ',
            'Location: ', COALESCE(p.location, 'Not specified'), ' | ',
            'Stock: ', p.quantity_available, '/', p.quantity_total
        ) as details,
        CONCAT('Unit: $', p.unit_price, ' | Total Value: $', 
            ROUND(p.quantity_available * p.unit_price, 2)) as financial_info,
        CONCAT(
            p.status, ' | ',
            CASE 
                WHEN p.quantity_available = 0 THEN '🔴 OUT OF STOCK'
                WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN '🟡 LOW STOCK'
                WHEN p.quantity_available <= (p.quantity_total * 0.3) THEN '🟠 MEDIUM STOCK'
                ELSE '🟢 WELL STOCKED'
            END
        ) as status_info,
        p.created_at::date as date_info,
        CONCAT(
            'Borrowed: ', p.quantity_borrowed, ' | ',
            'Min Level: ', COALESCE(p.minimum_stock_level, 5), ' | ',
            'Supplier: ', COALESCE(p.supplier, 'Not specified')
        ) as additional_info,
        CASE 
            WHEN p.quantity_available = 0 THEN 'CRITICAL'
            WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN 'HIGH'
            WHEN p.status != 'active' THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'INVENTORY' as category_group
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id

    UNION ALL

    -- 👥 STUDENTS DATA
    SELECT 
        'STUDENT' as data_type,
        LPAD(s.id::text, 3, '0') as record_id,
        s.name as main_info,
        CONCAT(
            'Email: ', s.email, ' | ',
            'Department: ', COALESCE(s.department, 'Not specified'), ' | ',
            'Year: ', COALESCE(s.year_of_study::text, 'Not specified')
        ) as details,
        CONCAT('Total Borrowed Value: $', 
            COALESCE(ROUND(SUM(o.total_value), 2), 0)) as financial_info,
        CONCAT(
            CASE WHEN s.is_active THEN '✅ Active' ELSE '❌ Inactive' END, ' | ',
            'Orders: ', COUNT(o.id), ' | ',
            CASE 
                WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 
                THEN '⚠️ Has Overdue'
                ELSE '✅ No Issues'
            END
        ) as status_info,
        s.created_at::date as date_info,
        CONCAT(
            'Phone: ', COALESCE(s.phone, 'Not provided'), ' | ',
            'Pending Orders: ', COUNT(CASE WHEN o.status = 'pending' THEN 1 END), ' | ',
            'Completed Orders: ', COUNT(CASE WHEN o.status = 'completed' THEN 1 END)
        ) as additional_info,
        CASE 
            WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 THEN 'HIGH'
            WHEN s.is_active = false THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'STUDENT' as category_group
    FROM students s
    LEFT JOIN orders o ON s.id = o.student_id
    GROUP BY s.id, s.name, s.email, s.department, s.year_of_study, s.is_active, s.created_at, s.phone

    UNION ALL

    -- 📋 ORDERS DATA
    SELECT 
        'ORDER' as data_type,
        LPAD(o.id::text, 3, '0') as record_id,
        CONCAT('Order #', o.order_number, ' - ', s.name) as main_info,
        CONCAT(
            'Student: ', s.name, ' (', s.department, ') | ',
            'Items: ', o.total_items, ' | ',
            'Priority: ', COALESCE(o.priority, 'Normal')
        ) as details,
        CONCAT('Total Value: $', o.total_value) as financial_info,
        CONCAT(
            UPPER(o.status), ' | ',
            CASE 
                WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE 
                THEN CONCAT('⚠️ OVERDUE (', (CURRENT_DATE - o.expected_return_date), ' days)')
                WHEN o.status = 'approved' AND o.expected_return_date = CURRENT_DATE 
                THEN '📅 DUE TODAY'
                WHEN o.status = 'approved' 
                THEN CONCAT('📋 Due in ', (o.expected_return_date - CURRENT_DATE), ' days')
                ELSE '📋 ' || UPPER(o.status)
            END
        ) as status_info,
        o.requested_date::date as date_info,
        CONCAT(
            'Expected Return: ', COALESCE(o.expected_return_date::text, 'Not set'), ' | ',
            'Approved: ', COALESCE(o.approved_date::text, 'Not yet'), ' | ',
            'Notes: ', COALESCE(SUBSTRING(o.notes, 1, 50), 'No notes')
        ) as additional_info,
        CASE 
            WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'CRITICAL'
            WHEN o.status = 'pending' THEN 'HIGH'
            WHEN o.status = 'approved' THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'ORDER' as category_group
    FROM orders o
    JOIN students s ON o.student_id = s.id

    UNION ALL

    -- 🛒 ORDER ITEMS DATA
    SELECT 
        'ORDER_ITEM' as data_type,
        LPAD(oi.id::text, 3, '0') as record_id,
        CONCAT(p.name, ' in Order #', o.order_number) as main_info,
        CONCAT(
            'Product: ', p.name, ' (', p.sku, ') | ',
            'Student: ', s.name, ' | ',
            'Requested: ', oi.quantity_requested, ' | Approved: ', oi.quantity_approved
        ) as details,
        CONCAT('Unit: $', oi.unit_price, ' | Total: $', oi.total_price) as financial_info,
        CONCAT(
            UPPER(oi.status), ' | ',
            CASE 
                WHEN oi.quantity_approved < oi.quantity_requested THEN '⚠️ Partial Approval'
                WHEN oi.quantity_approved = oi.quantity_requested THEN '✅ Fully Approved'
                ELSE '📋 Pending Review'
            END
        ) as status_info,
        o.requested_date::date as date_info,
        CONCAT(
            'Order Status: ', UPPER(o.status), ' | ',
            'Returnable: ', CASE WHEN oi.is_returnable THEN 'Yes' ELSE 'No' END, ' | ',
            'Returned: ', COALESCE(oi.quantity_returned, 0)
        ) as additional_info,
        CASE 
            WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'HIGH'
            WHEN oi.status = 'pending' THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'ORDER_ITEM' as category_group
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN students s ON o.student_id = s.id
    JOIN products p ON oi.product_id = p.id

    UNION ALL

    -- 📈 FINANCIAL SUMMARY
    SELECT 
        'FINANCIAL_SUMMARY' as data_type,
        '002' as record_id,
        'Complete Financial Overview' as main_info,
        CONCAT(
            'Active Inventory Items: ', (SELECT COUNT(*) FROM products WHERE status = 'active'), ' | ',
            'Total Students: ', (SELECT COUNT(*) FROM students WHERE is_active = true), ' | ',
            'Active Orders: ', (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'approved'))
        ) as details,
        CONCAT(
            'Inventory Value: $', 
            COALESCE((SELECT ROUND(SUM(quantity_available * unit_price), 2) FROM products WHERE status = 'active'), 0),
            ' | Completed Orders: $',
            COALESCE((SELECT ROUND(SUM(total_value), 2) FROM orders WHERE status = 'completed'), 0)
        ) as financial_info,
        CONCAT(
            'Low Stock Items: ', 
            (SELECT COUNT(*) FROM products WHERE quantity_available <= COALESCE(minimum_stock_level, 5) AND status = 'active'),
            ' | Overdue Orders: ',
            (SELECT COUNT(*) FROM orders WHERE status = 'approved' AND expected_return_date < CURRENT_DATE)
        ) as status_info,
        CURRENT_DATE as date_info,
        CONCAT(
            'Avg Order Value: $',
            COALESCE((SELECT ROUND(AVG(total_value), 2) FROM orders), 0),
            ' | Total Order Items: ',
            (SELECT COUNT(*) FROM order_items)
        ) as additional_info,
        CASE 
            WHEN (SELECT COUNT(*) FROM products WHERE quantity_available = 0 AND status = 'active') > 0 THEN 'HIGH'
            WHEN (SELECT COUNT(*) FROM orders WHERE status = 'approved' AND expected_return_date < CURRENT_DATE) > 0 THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'FINANCIAL' as category_group

    UNION ALL

    -- ⚠️ ALERTS AND ISSUES
    SELECT 
        'ALERT' as data_type,
        LPAD(ROW_NUMBER() OVER (ORDER BY priority_order)::text, 3, '0') as record_id,
        alert_title as main_info,
        alert_details as details,
        financial_impact as financial_info,
        alert_status as status_info,
        CURRENT_DATE as date_info,
        recommended_action as additional_info,
        alert_priority as priority_level,
        'ALERT' as category_group
    FROM (
        -- Critical stock alerts
        SELECT 
            1 as priority_order,
            CONCAT('🔴 OUT OF STOCK: ', p.name) as alert_title,
            CONCAT('Product: ', p.name, ' (', p.sku, ') | Category: ', COALESCE(c.name, 'Uncategorized')) as alert_details,
            CONCAT('Lost potential revenue: $', ROUND(p.unit_price * COALESCE(p.minimum_stock_level, 5), 2)) as financial_impact,
            'CRITICAL - IMMEDIATE ACTION REQUIRED' as alert_status,
            'Restock immediately or mark as discontinued' as recommended_action,
            'CRITICAL' as alert_priority
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.quantity_available = 0 AND p.status = 'active'
        
        UNION ALL
        
        -- Overdue orders
        SELECT 
            2 as priority_order,
            CONCAT('⚠️ OVERDUE ORDER: #', o.order_number) as alert_title,
            CONCAT('Student: ', s.name, ' | Days overdue: ', (CURRENT_DATE - o.expected_return_date)) as alert_details,
            CONCAT('Value at risk: $', o.total_value) as financial_impact,
            'HIGH PRIORITY - CONTACT STUDENT' as alert_status,
            'Contact student immediately for item return' as recommended_action,
            'HIGH' as alert_priority
        FROM orders o
        JOIN students s ON o.student_id = s.id
        WHERE o.status = 'approved' AND o.expected_return_date < CURRENT_DATE
        
        UNION ALL
        
        -- Low stock warnings
        SELECT 
            3 as priority_order,
            CONCAT('🟡 LOW STOCK: ', p.name) as alert_title,
            CONCAT('Current: ', p.quantity_available, ' | Min level: ', COALESCE(p.minimum_stock_level, 5)) as alert_details,
            CONCAT('Restock cost: $', ROUND(p.unit_price * (COALESCE(p.minimum_stock_level, 5) - p.quantity_available), 2)) as financial_impact,
            'MEDIUM PRIORITY - RESTOCK SOON' as alert_status,
            'Order additional stock before running out' as recommended_action,
            'MEDIUM' as alert_priority
        FROM products p
        WHERE p.quantity_available <= COALESCE(p.minimum_stock_level, 5) 
          AND p.quantity_available > 0 
          AND p.status = 'active'
    ) alerts

) combined_data

ORDER BY 
    CASE category_group
        WHEN 'OVERVIEW' THEN 1
        WHEN 'ALERT' THEN 2
        WHEN 'FINANCIAL' THEN 3
        WHEN 'CATEGORY' THEN 4
        WHEN 'INVENTORY' THEN 5
        WHEN 'STUDENT' THEN 6
        WHEN 'ORDER' THEN 7
        WHEN 'ORDER_ITEM' THEN 8
        ELSE 9
    END,
    CASE priority_level
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
    END,
    record_id;

-- =========================================
-- END ALL-IN-ONE QUERY
-- =========================================
