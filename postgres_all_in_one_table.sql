-- =========================================
-- ALL-IN-ONE TABLE VIEW FOR POSTGRESQL
-- Copy this entire query and paste into pgAdmin Query Editor
-- =========================================

SELECT 
    -- Main identification columns
    ROW_NUMBER() OVER (ORDER BY category_order, priority_order, record_id) as row_num,
    data_type,
    record_id,
    main_info,
    details,
    financial_info,
    status_info,
    date_info,
    additional_info,
    priority_level,
    category_group
FROM (
    -- 📊 SYSTEM OVERVIEW
    SELECT 
        1 as category_order,
        5 as priority_order,
        'SYSTEM_OVERVIEW' as data_type,
        '001' as record_id,
        'Database Statistics Summary' as main_info,
        CONCAT(
            'Categories: ', (SELECT COUNT(*) FROM categories), ' | ',
            'Products: ', (SELECT COUNT(*) FROM products), ' | ',
            'Students: ', (SELECT COUNT(*) FROM students), ' | ',
            'Orders: ', (SELECT COUNT(*) FROM orders), ' | ',
            'Order Items: ', (SELECT COUNT(*) FROM order_items)
        ) as details,
        CONCAT('Total Inventory Value: $', 
            COALESCE(ROUND((SELECT SUM(quantity_available * unit_price) FROM products WHERE status = 'active'), 2), 0)
        ) as financial_info,
        CONCAT('Active Products: ', (SELECT COUNT(*) FROM products WHERE status = 'active'),
               ' | Low Stock: ', (SELECT COUNT(*) FROM products WHERE quantity_available <= COALESCE(minimum_stock_level, 5) AND status = 'active')
        ) as status_info,
        CURRENT_DATE as date_info,
        'Complete system overview and health metrics' as additional_info,
        'INFO' as priority_level,
        'A_OVERVIEW' as category_group

    UNION ALL

    -- 🏷️ CATEGORIES
    SELECT 
        2 as category_order,
        CASE WHEN COUNT(p.id) = 0 THEN 2 ELSE 4 END as priority_order,
        'CATEGORY' as data_type,
        c.id::text as record_id,
        c.name as main_info,
        COALESCE(c.description, 'No description available') as details,
        CONCAT('Total Products: ', COUNT(p.id), 
               ' | Avg Price: $', COALESCE(ROUND(AVG(p.unit_price), 2), 0),
               ' | Total Value: $', COALESCE(ROUND(SUM(p.quantity_available * p.unit_price), 2), 0)
        ) as financial_info,
        CASE 
            WHEN COUNT(p.id) = 0 THEN '❌ Empty Category - Needs Products'
            WHEN COUNT(p.id) < 3 THEN '🟡 Few Products Available'
            WHEN COUNT(p.id) < 10 THEN '🟠 Moderate Selection'
            ELSE '✅ Well Stocked Category'
        END as status_info,
        c.created_at::date as date_info,
        CONCAT('Created: ', c.created_at::date, 
               ' | Last Updated: ', COALESCE(c.updated_at::date, 'Never')
        ) as additional_info,
        CASE 
            WHEN COUNT(p.id) = 0 THEN 'MEDIUM'
            WHEN COUNT(p.id) < 3 THEN 'LOW'
            ELSE 'LOW'
        END as priority_level,
        'B_CATEGORIES' as category_group
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at

    UNION ALL

    -- 📦 PRODUCTS
    SELECT 
        3 as category_order,
        CASE 
            WHEN p.quantity_available = 0 THEN 1
            WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN 2
            ELSE 4
        END as priority_order,
        'PRODUCT' as data_type,
        p.id::text as record_id,
        CONCAT(p.name, ' (SKU: ', p.sku, ')') as main_info,
        CONCAT(
            'Category: ', COALESCE(c.name, 'Uncategorized'), ' | ',
            'Stock: ', p.quantity_available, '/', p.quantity_total, ' | ',
            'Borrowed: ', COALESCE(p.quantity_borrowed, 0), ' | ',
            'Location: ', COALESCE(p.location, 'Not specified')
        ) as details,
        CONCAT('Unit Price: $', p.unit_price, 
               ' | Current Value: $', ROUND(p.quantity_available * p.unit_price, 2),
               ' | Total Value: $', ROUND(p.quantity_total * p.unit_price, 2)
        ) as financial_info,
        CONCAT(
            UPPER(p.status), ' | ',
            CASE 
                WHEN p.quantity_available = 0 THEN '🔴 OUT OF STOCK'
                WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN '🟡 LOW STOCK'
                WHEN p.quantity_available <= (p.quantity_total * 0.3) THEN '🟠 MEDIUM STOCK'
                ELSE '🟢 WELL STOCKED'
            END
        ) as status_info,
        p.created_at::date as date_info,
        CONCAT(
            'Min Level: ', COALESCE(p.minimum_stock_level, 5), ' | ',
            'Supplier: ', COALESCE(p.supplier, 'Not specified'), ' | ',
            'Warranty: ', COALESCE(p.warranty_until::text, 'Not specified')
        ) as additional_info,
        CASE 
            WHEN p.quantity_available = 0 AND p.status = 'active' THEN 'CRITICAL'
            WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) AND p.status = 'active' THEN 'HIGH'
            WHEN p.status != 'active' THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'C_PRODUCTS' as category_group
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id

    UNION ALL

    -- 👥 STUDENTS
    SELECT 
        4 as category_order,
        CASE 
            WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 THEN 2
            WHEN s.is_active = false THEN 3
            ELSE 4
        END as priority_order,
        'STUDENT' as data_type,
        s.id::text as record_id,
        s.name as main_info,
        CONCAT(
            'Email: ', s.email, ' | ',
            'Department: ', COALESCE(s.department, 'Not specified'), ' | ',
            'Year: ', COALESCE(s.year_of_study::text, 'Not specified'), ' | ',
            'Phone: ', COALESCE(s.phone, 'Not provided')
        ) as details,
        CONCAT('Total Orders: ', COUNT(DISTINCT o.id), 
               ' | Total Borrowed: $', COALESCE(ROUND(SUM(o.total_value), 2), 0),
               ' | Avg Order: $', COALESCE(ROUND(AVG(o.total_value), 2), 0)
        ) as financial_info,
        CONCAT(
            CASE WHEN s.is_active THEN '✅ Active Student' ELSE '❌ Inactive Student' END, ' | ',
            CASE 
                WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 
                THEN CONCAT('⚠️ Has ', COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END), ' Overdue Items')
                WHEN COUNT(CASE WHEN o.status = 'pending' THEN 1 END) > 0
                THEN CONCAT('📋 Has ', COUNT(CASE WHEN o.status = 'pending' THEN 1 END), ' Pending Orders')
                ELSE '✅ No Issues'
            END
        ) as status_info,
        s.created_at::date as date_info,
        CONCAT(
            'Student ID: ', COALESCE(s.student_id, 'Not provided'), ' | ',
            'Address: ', COALESCE(SUBSTRING(s.address, 1, 30), 'Not provided'), ' | ',
            'Registered: ', s.created_at::date
        ) as additional_info,
        CASE 
            WHEN COUNT(CASE WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1 END) > 0 THEN 'HIGH'
            WHEN s.is_active = false THEN 'MEDIUM'
            WHEN COUNT(o.id) = 0 THEN 'LOW'
            ELSE 'LOW'
        END as priority_level,
        'D_STUDENTS' as category_group
    FROM students s
    LEFT JOIN orders o ON s.id = o.student_id
    GROUP BY s.id, s.name, s.email, s.department, s.year_of_study, s.phone, 
             s.is_active, s.created_at, s.student_id, s.address

    UNION ALL

    -- 📋 ORDERS
    SELECT 
        5 as category_order,
        CASE 
            WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 1
            WHEN o.status = 'pending' THEN 2
            WHEN o.status = 'approved' THEN 3
            ELSE 4
        END as priority_order,
        'ORDER' as data_type,
        o.id::text as record_id,
        CONCAT('Order #', o.order_number, ' - ', s.name) as main_info,
        CONCAT(
            'Student: ', s.name, ' (', COALESCE(s.department, 'No Dept'), ') | ',
            'Items: ', o.total_items, ' | ',
            'Status: ', UPPER(o.status), ' | ',
            'Priority: ', COALESCE(o.priority, 'Normal')
        ) as details,
        CONCAT('Total Value: $', o.total_value,
               ' | Avg Item Value: $', CASE WHEN o.total_items > 0 THEN ROUND(o.total_value / o.total_items, 2) ELSE 0 END
        ) as financial_info,
        CONCAT(
            UPPER(o.status), ' | ',
            CASE 
                WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE 
                THEN CONCAT('🔴 OVERDUE by ', (CURRENT_DATE - o.expected_return_date), ' days')
                WHEN o.status = 'approved' AND o.expected_return_date = CURRENT_DATE 
                THEN '🟡 DUE TODAY'
                WHEN o.status = 'approved' 
                THEN CONCAT('📅 Due in ', (o.expected_return_date - CURRENT_DATE), ' days')
                WHEN o.status = 'pending'
                THEN '⏳ AWAITING APPROVAL'
                ELSE CONCAT('📋 ', UPPER(o.status))
            END
        ) as status_info,
        o.requested_date::date as date_info,
        CONCAT(
            'Requested: ', o.requested_date::date, ' | ',
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
        'E_ORDERS' as category_group
    FROM orders o
    JOIN students s ON o.student_id = s.id

    UNION ALL

    -- 🛒 ORDER ITEMS
    SELECT 
        6 as category_order,
        CASE 
            WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 2
            WHEN oi.status = 'pending' THEN 3
            ELSE 4
        END as priority_order,
        'ORDER_ITEM' as data_type,
        oi.id::text as record_id,
        CONCAT(p.name, ' in Order #', o.order_number) as main_info,
        CONCAT(
            'Product: ', p.name, ' (', p.sku, ') | ',
            'Student: ', s.name, ' | ',
            'Requested: ', oi.quantity_requested, ' | ',
            'Approved: ', COALESCE(oi.quantity_approved, 0), ' | ',
            'Returned: ', COALESCE(oi.quantity_returned, 0)
        ) as details,
        CONCAT('Unit Price: $', oi.unit_price, 
               ' | Line Total: $', oi.total_price,
               ' | Expected Value: $', (oi.quantity_requested * oi.unit_price)
        ) as financial_info,
        CONCAT(
            UPPER(oi.status), ' | ',
            CASE 
                WHEN oi.quantity_approved = 0 THEN '⏳ PENDING APPROVAL'
                WHEN oi.quantity_approved < oi.quantity_requested THEN '🟡 PARTIAL APPROVAL'
                WHEN oi.quantity_approved = oi.quantity_requested THEN '✅ FULLY APPROVED'
                ELSE '📋 UNDER REVIEW'
            END, ' | ',
            CASE WHEN oi.is_returnable THEN 'Returnable' ELSE 'Non-returnable' END
        ) as status_info,
        o.requested_date::date as date_info,
        CONCAT(
            'Order Status: ', UPPER(o.status), ' | ',
            'Expected Return: ', COALESCE(o.expected_return_date::text, 'Not set'), ' | ',
            'Item Notes: ', COALESCE(SUBSTRING(oi.notes, 1, 30), 'No notes')
        ) as additional_info,
        CASE 
            WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'HIGH'
            WHEN oi.status = 'pending' THEN 'MEDIUM'
            WHEN oi.quantity_approved < oi.quantity_requested THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'F_ORDER_ITEMS' as category_group
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN students s ON o.student_id = s.id
    JOIN products p ON oi.product_id = p.id

    UNION ALL

    -- 💰 FINANCIAL SUMMARY
    SELECT 
        7 as category_order,
        5 as priority_order,
        'FINANCIAL_SUMMARY' as data_type,
        '999' as record_id,
        'Complete Financial Overview' as main_info,
        CONCAT(
            'Active Products: ', (SELECT COUNT(*) FROM products WHERE status = 'active'), ' | ',
            'Total Students: ', (SELECT COUNT(*) FROM students WHERE is_active = true), ' | ',
            'Active Orders: ', (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'approved'))
        ) as details,
        CONCAT(
            'Inventory Value: $', 
            COALESCE((SELECT ROUND(SUM(quantity_available * unit_price), 2) FROM products WHERE status = 'active'), 0), ' | ',
            'Orders Value: $',
            COALESCE((SELECT ROUND(SUM(total_value), 2) FROM orders WHERE status IN ('pending', 'approved')), 0), ' | ',
            'Completed Value: $',
            COALESCE((SELECT ROUND(SUM(total_value), 2) FROM orders WHERE status = 'completed'), 0)
        ) as financial_info,
        CONCAT(
            'Critical Stock: ', 
            (SELECT COUNT(*) FROM products WHERE quantity_available = 0 AND status = 'active'), ' | ',
            'Low Stock: ', 
            (SELECT COUNT(*) FROM products WHERE quantity_available <= COALESCE(minimum_stock_level, 5) AND quantity_available > 0 AND status = 'active'), ' | ',
            'Overdue Orders: ',
            (SELECT COUNT(*) FROM orders WHERE status = 'approved' AND expected_return_date < CURRENT_DATE)
        ) as status_info,
        CURRENT_DATE as date_info,
        CONCAT(
            'Avg Order Value: $',
            COALESCE((SELECT ROUND(AVG(total_value), 2) FROM orders), 0), ' | ',
            'Total Order Items: ',
            (SELECT COUNT(*) FROM order_items), ' | ',
            'System Health: ', 
            CASE 
                WHEN (SELECT COUNT(*) FROM products WHERE quantity_available = 0 AND status = 'active') > 0 THEN 'Needs Attention'
                ELSE 'Good'
            END
        ) as additional_info,
        CASE 
            WHEN (SELECT COUNT(*) FROM products WHERE quantity_available = 0 AND status = 'active') > 0 THEN 'HIGH'
            WHEN (SELECT COUNT(*) FROM orders WHERE status = 'approved' AND expected_return_date < CURRENT_DATE) > 0 THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority_level,
        'G_FINANCIAL' as category_group

) combined_data

ORDER BY category_order, priority_order, record_id::integer;

-- =========================================
-- END OF ALL-IN-ONE TABLE QUERY
-- =========================================

/*
INSTRUCTIONS FOR USE IN PGADMIN:

1. Copy this entire query (Ctrl+A, Ctrl+C)
2. Open pgAdmin and connect to your inventory_management database
3. Click on "Query Tool" button (or press F5)
4. Paste the query (Ctrl+V)
5. Click "Execute" button (or press F5)

COLUMNS EXPLANATION:
- row_num: Sequential row number for easy reference
- data_type: Type of data (SYSTEM_OVERVIEW, CATEGORY, PRODUCT, STUDENT, ORDER, ORDER_ITEM, FINANCIAL_SUMMARY)
- record_id: Unique identifier for the record
- main_info: Primary information about the record
- details: Detailed description and specifications
- financial_info: Financial data and calculations
- status_info: Current status with visual indicators
- date_info: Relevant dates
- additional_info: Extra details and metadata
- priority_level: Priority for attention (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- category_group: Grouping for organization

PRIORITY LEVELS:
🔴 CRITICAL - Immediate attention required
🟡 HIGH - Should be addressed soon  
🟠 MEDIUM - Monitor and plan action
🟢 LOW - Routine monitoring
ℹ️ INFO - Informational only
*/
