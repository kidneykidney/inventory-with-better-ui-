-- =========================================
-- COLLEGE INCUBATION INVENTORY MANAGEMENT SYSTEM
-- COMPREHENSIVE DATA QUERIES
-- =========================================

-- 1. DATABASE OVERVIEW - Get record counts from all tables
-- =========================================
SELECT 
    'categories' as table_name, 
    COUNT(*) as record_count,
    'Product categories in the system' as description
FROM categories

UNION ALL

SELECT 
    'products' as table_name, 
    COUNT(*) as record_count,
    'Inventory items available for lending' as description
FROM products

UNION ALL

SELECT 
    'students' as table_name, 
    COUNT(*) as record_count,
    'Registered students who can borrow items' as description
FROM students

UNION ALL

SELECT 
    'orders' as table_name, 
    COUNT(*) as record_count,
    'Borrowing requests and orders' as description
FROM orders

UNION ALL

SELECT 
    'order_items' as table_name, 
    COUNT(*) as record_count,
    'Individual items within orders' as description
FROM order_items

ORDER BY table_name;

-- 2. COMPLETE CATEGORIES TABLE
-- =========================================
SELECT 
    c.id,
    c.name as category_name,
    c.description,
    c.created_at,
    c.updated_at,
    COUNT(p.id) as total_products
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
ORDER BY c.name;

-- 3. DETAILED PRODUCTS INVENTORY
-- =========================================
SELECT 
    p.id,
    p.name as product_name,
    p.description,
    p.sku,
    c.name as category,
    p.quantity_total,
    p.quantity_available,
    p.quantity_borrowed,
    p.unit_price,
    p.status,
    p.location,
    p.minimum_stock_level,
    p.supplier,
    p.purchase_date,
    p.warranty_until,
    p.created_at,
    p.updated_at,
    -- Stock status indicator
    CASE 
        WHEN p.quantity_available = 0 THEN 'OUT_OF_STOCK'
        WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN 'LOW_STOCK'
        WHEN p.quantity_available <= (p.quantity_total * 0.2) THEN 'MEDIUM_STOCK'
        ELSE 'WELL_STOCKED'
    END as stock_status,
    -- Financial value
    (p.quantity_available * p.unit_price) as current_inventory_value
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name;

-- 4. STUDENT INFORMATION WITH BORROWING HISTORY
-- =========================================
SELECT 
    s.id,
    s.name as student_name,
    s.email,
    s.student_id,
    s.department,
    s.year_of_study,
    s.phone,
    s.address,
    s.is_active,
    s.created_at,
    s.updated_at,
    -- Borrowing statistics
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'approved' THEN o.id END) as approved_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END) as returned_orders,
    COALESCE(SUM(o.total_value), 0) as total_borrowed_value,
    -- Latest order information
    MAX(o.requested_date) as last_order_date
FROM students s
LEFT JOIN orders o ON s.id = o.student_id
GROUP BY s.id, s.name, s.email, s.student_id, s.department, 
         s.year_of_study, s.phone, s.address, s.is_active, 
         s.created_at, s.updated_at
ORDER BY s.name;

-- 5. COMPREHENSIVE ORDERS VIEW
-- =========================================
SELECT 
    o.id,
    o.order_number,
    s.name as student_name,
    s.email as student_email,
    s.department,
    o.status,
    o.priority,
    o.total_items,
    o.total_value,
    o.requested_date,
    o.approved_date,
    o.expected_return_date,
    o.actual_return_date,
    o.notes,
    o.created_at,
    o.updated_at,
    -- Status indicators
    CASE 
        WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN o.status = 'approved' AND o.expected_return_date = CURRENT_DATE THEN 'DUE_TODAY'
        WHEN o.status = 'approved' AND o.expected_return_date > CURRENT_DATE THEN 'ACTIVE'
        ELSE UPPER(o.status)
    END as order_status_detail,
    -- Time calculations
    CASE 
        WHEN o.expected_return_date IS NOT NULL 
        THEN (o.expected_return_date - CURRENT_DATE) 
    END as days_until_due,
    CASE 
        WHEN o.approved_date IS NOT NULL 
        THEN (o.approved_date - o.requested_date) 
    END as approval_time_days
FROM orders o
JOIN students s ON o.student_id = s.id
ORDER BY o.requested_date DESC;

-- 6. ORDER ITEMS DETAIL
-- =========================================
SELECT 
    oi.id,
    o.order_number,
    s.name as student_name,
    p.name as product_name,
    p.sku,
    c.name as category,
    oi.quantity_requested,
    oi.quantity_approved,
    oi.unit_price,
    oi.total_price,
    oi.status as item_status,
    oi.notes as item_notes,
    o.status as order_status,
    o.requested_date,
    o.expected_return_date,
    -- Calculate individual item value
    (oi.quantity_approved * oi.unit_price) as approved_value
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN students s ON o.student_id = s.id
JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY o.requested_date DESC, p.name;

-- 7. FINANCIAL SUMMARY REPORT
-- =========================================
SELECT 
    'Total Inventory Value' as metric,
    CONCAT('$', FORMAT(SUM(quantity_available * unit_price), 2)) as value,
    'Current value of all available inventory' as description
FROM products WHERE status = 'active'

UNION ALL

SELECT 
    'Total Products Value' as metric,
    CONCAT('$', FORMAT(SUM(quantity_total * unit_price), 2)) as value,
    'Total value of all products (including borrowed)' as description
FROM products WHERE status = 'active'

UNION ALL

SELECT 
    'Active Orders Value' as metric,
    CONCAT('$', FORMAT(COALESCE(SUM(total_value), 0), 2)) as value,
    'Value of currently pending and approved orders' as description
FROM orders WHERE status IN ('pending', 'approved')

UNION ALL

SELECT 
    'Completed Orders Value' as metric,
    CONCAT('$', FORMAT(COALESCE(SUM(total_value), 0), 2)) as value,
    'Total value of completed borrowing transactions' as description
FROM orders WHERE status = 'completed'

UNION ALL

SELECT 
    'Average Order Value' as metric,
    CONCAT('$', FORMAT(COALESCE(AVG(total_value), 0), 2)) as value,
    'Average value per order' as description
FROM orders WHERE status != 'cancelled';

-- 8. INVENTORY STATUS BREAKDOWN
-- =========================================
SELECT 
    status,
    COUNT(*) as product_count,
    SUM(quantity_total) as total_quantity,
    SUM(quantity_available) as available_quantity,
    SUM(quantity_borrowed) as borrowed_quantity,
    CONCAT('$', FORMAT(SUM(quantity_total * unit_price), 2)) as total_value,
    CONCAT('$', FORMAT(AVG(unit_price), 2)) as avg_price
FROM products
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'active' THEN 1 
        WHEN 'inactive' THEN 2 
        WHEN 'discontinued' THEN 3 
        ELSE 4 
    END;

-- 9. LOW STOCK ALERT
-- =========================================
SELECT 
    p.id,
    p.name as product_name,
    p.sku,
    c.name as category,
    p.quantity_available,
    p.minimum_stock_level,
    p.unit_price,
    p.location,
    -- Calculate shortage
    GREATEST(0, COALESCE(p.minimum_stock_level, 5) - p.quantity_available) as shortage_quantity,
    -- Estimated reorder cost
    GREATEST(0, COALESCE(p.minimum_stock_level, 5) - p.quantity_available) * p.unit_price as reorder_cost,
    -- Priority level
    CASE 
        WHEN p.quantity_available = 0 THEN 'CRITICAL'
        WHEN p.quantity_available <= (COALESCE(p.minimum_stock_level, 5) * 0.5) THEN 'HIGH'
        WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN 'MEDIUM'
        ELSE 'LOW'
    END as priority_level
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.quantity_available <= COALESCE(p.minimum_stock_level, 5)
  AND p.status = 'active'
ORDER BY 
    CASE 
        WHEN p.quantity_available = 0 THEN 1
        WHEN p.quantity_available <= (COALESCE(p.minimum_stock_level, 5) * 0.5) THEN 2
        ELSE 3
    END,
    (COALESCE(p.minimum_stock_level, 5) - p.quantity_available) DESC;

-- 10. STUDENT ACTIVITY SUMMARY
-- =========================================
SELECT 
    s.department,
    s.year_of_study,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_students,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_value), 0) as total_borrowed_value,
    COALESCE(AVG(o.total_value), 0) as avg_order_value,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'approved') as approved_orders,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') as completed_orders
FROM students s
LEFT JOIN orders o ON s.id = o.student_id
GROUP BY s.department, s.year_of_study
ORDER BY s.department, s.year_of_study;

-- 11. MONTHLY ACTIVITY REPORT
-- =========================================
SELECT 
    DATE_TRUNC('month', o.requested_date) as month,
    COUNT(*) as total_orders,
    COUNT(DISTINCT o.student_id) as unique_students,
    SUM(o.total_items) as total_items_requested,
    SUM(o.total_value) as total_value,
    AVG(o.total_value) as avg_order_value,
    COUNT(*) FILTER (WHERE o.status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE o.status = 'pending') as pending_orders
FROM orders o
WHERE o.requested_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', o.requested_date)
ORDER BY month DESC;

-- 12. PRODUCT POPULARITY ANALYSIS
-- =========================================
SELECT 
    p.id,
    p.name as product_name,
    p.sku,
    c.name as category,
    COUNT(oi.id) as times_requested,
    SUM(oi.quantity_requested) as total_quantity_requested,
    SUM(oi.quantity_approved) as total_quantity_approved,
    AVG(oi.quantity_requested) as avg_quantity_per_request,
    SUM(oi.total_price) as total_revenue,
    p.quantity_total,
    p.quantity_available,
    -- Utilization rate
    CASE 
        WHEN p.quantity_total > 0 
        THEN ROUND((p.quantity_borrowed::DECIMAL / p.quantity_total * 100), 2)
        ELSE 0 
    END as utilization_percentage
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.sku, c.name, p.quantity_total, 
         p.quantity_available, p.quantity_borrowed
ORDER BY times_requested DESC NULLS LAST, total_quantity_requested DESC NULLS LAST;

-- 13. OVERDUE ITEMS REPORT
-- =========================================
SELECT 
    o.order_number,
    s.name as student_name,
    s.email,
    s.phone,
    s.department,
    p.name as product_name,
    p.sku,
    oi.quantity_approved,
    o.expected_return_date,
    (CURRENT_DATE - o.expected_return_date) as days_overdue,
    oi.total_price as overdue_value,
    o.notes,
    CASE 
        WHEN (CURRENT_DATE - o.expected_return_date) >= 30 THEN 'SEVERELY_OVERDUE'
        WHEN (CURRENT_DATE - o.expected_return_date) >= 7 THEN 'OVERDUE'
        ELSE 'RECENTLY_OVERDUE'
    END as overdue_severity
FROM orders o
JOIN students s ON o.student_id = s.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'approved' 
  AND o.expected_return_date < CURRENT_DATE
ORDER BY (CURRENT_DATE - o.expected_return_date) DESC;

-- 14. COMPLETE PROJECT DATA VIEW (MASTER QUERY)
-- =========================================
-- This query provides a comprehensive view of all project data
SELECT 
    'CATEGORY' as data_type,
    c.id::text as record_id,
    c.name as primary_info,
    c.description as secondary_info,
    NULL as tertiary_info,
    c.created_at as date_info,
    (SELECT COUNT(*) FROM products WHERE category_id = c.id)::text as count_info
FROM categories c

UNION ALL

SELECT 
    'PRODUCT' as data_type,
    p.id::text as record_id,
    p.name as primary_info,
    CONCAT('SKU: ', p.sku, ' | Qty: ', p.quantity_available, '/', p.quantity_total) as secondary_info,
    CONCAT('Price: $', p.unit_price, ' | Status: ', p.status) as tertiary_info,
    p.created_at as date_info,
    p.location as count_info
FROM products p

UNION ALL

SELECT 
    'STUDENT' as data_type,
    s.id::text as record_id,
    s.name as primary_info,
    s.email as secondary_info,
    CONCAT('Dept: ', COALESCE(s.department, 'N/A'), ' | Year: ', COALESCE(s.year_of_study::text, 'N/A')) as tertiary_info,
    s.created_at as date_info,
    (SELECT COUNT(*) FROM orders WHERE student_id = s.id)::text as count_info
FROM students s

UNION ALL

SELECT 
    'ORDER' as data_type,
    o.id::text as record_id,
    CONCAT('Order #', o.order_number) as primary_info,
    CONCAT('Status: ', o.status, ' | Items: ', o.total_items) as secondary_info,
    CONCAT('Value: $', o.total_value, ' | Student ID: ', o.student_id) as tertiary_info,
    o.requested_date as date_info,
    o.expected_return_date::text as count_info
FROM orders o

ORDER BY data_type, record_id::integer;

-- =========================================
-- END OF PROJECT DATA QUERIES
-- =========================================
