-- ===== INVENTORY MANAGEMENT DATABASE QUERIES =====
-- Run these queries in pgAdmin to explore and manage your data

-- ===== 1. TABLE OVERVIEW QUERIES =====

-- Count all records in each table
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'students' as table_name, COUNT(*) as record_count FROM students
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as record_count FROM order_items
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as record_count FROM notifications
ORDER BY record_count DESC;

-- ===== 2. PRODUCTS QUERIES =====

-- View all active products
SELECT id, name, sku, unit_price, quantity_available, location, status
FROM products 
WHERE status = 'active'
ORDER BY name;

-- View all products (including deleted)
SELECT id, name, sku, unit_price, quantity_available, location, status, created_at
FROM products 
ORDER BY created_at DESC;

-- Products with low stock (below minimum level)
SELECT name, sku, quantity_available, minimum_stock_level, 
       (minimum_stock_level - quantity_available) as shortage
FROM products 
WHERE quantity_available < minimum_stock_level 
  AND status = 'active'
ORDER BY shortage DESC;

-- Most expensive products
SELECT name, sku, unit_price, location
FROM products 
WHERE status = 'active'
ORDER BY unit_price DESC 
LIMIT 10;

-- Products by category (if you have categories)
SELECT p.name, p.sku, p.unit_price, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active'
ORDER BY c.name, p.name;

-- ===== 3. STUDENTS QUERIES =====

-- All active students
SELECT student_id, name, email, department, year_of_study, course
FROM students 
WHERE is_active = true
ORDER BY name;

-- Students by department
SELECT department, COUNT(*) as student_count
FROM students 
WHERE is_active = true
GROUP BY department
ORDER BY student_count DESC;

-- Recently registered students (last 30 days)
SELECT name, email, department, created_at
FROM students 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ===== 4. ORDERS QUERIES =====

-- All orders with student information
SELECT 
    o.order_number,
    s.name as student_name,
    s.department,
    o.status,
    o.total_items,
    o.total_value,
    o.requested_date,
    o.expected_return_date
FROM orders o
JOIN students s ON o.student_id = s.id
ORDER BY o.requested_date DESC;

-- Orders by status
SELECT status, COUNT(*) as order_count, SUM(total_value) as total_value
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- Pending orders (need approval)
SELECT 
    o.order_number,
    s.name as student_name,
    s.email,
    o.total_items,
    o.total_value,
    o.requested_date,
    o.notes
FROM orders o
JOIN students s ON o.student_id = s.id
WHERE o.status = 'pending'
ORDER BY o.requested_date;

-- Overdue returns (past expected return date)
SELECT 
    o.order_number,
    s.name as student_name,
    s.email,
    o.expected_return_date,
    (CURRENT_DATE - o.expected_return_date::date) as days_overdue
FROM orders o
JOIN students s ON o.student_id = s.id
WHERE o.status = 'approved' 
  AND o.expected_return_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- Monthly order statistics
SELECT 
    DATE_TRUNC('month', requested_date) as month,
    COUNT(*) as total_orders,
    SUM(total_value) as total_value,
    AVG(total_value) as avg_order_value
FROM orders
WHERE requested_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', requested_date)
ORDER BY month DESC;

-- ===== 5. ORDER ITEMS QUERIES =====

-- View order items with product and order details
SELECT 
    oi.id,
    o.order_number,
    p.name as product_name,
    p.sku,
    oi.quantity_requested,
    oi.quantity_approved,
    oi.unit_price,
    oi.total_price,
    oi.status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
ORDER BY o.requested_date DESC, p.name;

-- Most requested products
SELECT 
    p.name,
    p.sku,
    COUNT(*) as times_requested,
    SUM(oi.quantity_requested) as total_quantity_requested
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.id, p.name, p.sku
ORDER BY times_requested DESC
LIMIT 10;

-- Products currently on loan (approved but not returned)
SELECT 
    p.name as product_name,
    p.sku,
    s.name as student_name,
    o.order_number,
    oi.quantity_approved,
    o.expected_return_date
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
JOIN students s ON o.student_id = s.id
WHERE oi.status = 'approved' 
  AND oi.quantity_returned = 0
ORDER BY o.expected_return_date;

-- ===== 6. FINANCIAL QUERIES =====

-- Total value of all orders by status
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total_value) as total_value,
    AVG(total_value) as average_value
FROM orders
GROUP BY status;

-- Revenue by month (approved orders)
SELECT 
    TO_CHAR(approved_date, 'YYYY-MM') as month,
    SUM(total_value) as monthly_revenue,
    COUNT(*) as orders_approved
FROM orders
WHERE status = 'approved' AND approved_date IS NOT NULL
GROUP BY TO_CHAR(approved_date, 'YYYY-MM')
ORDER BY month DESC;

-- ===== 7. INVENTORY STATUS QUERIES =====

-- Current inventory value
SELECT 
    SUM(quantity_available * unit_price) as total_inventory_value,
    COUNT(*) as total_products
FROM products 
WHERE status = 'active';

-- Inventory by location
SELECT 
    location,
    COUNT(*) as product_count,
    SUM(quantity_available) as total_quantity,
    SUM(quantity_available * unit_price) as location_value
FROM products 
WHERE status = 'active'
GROUP BY location
ORDER BY location_value DESC;

-- ===== 8. STUDENT ACTIVITY QUERIES =====

-- Most active students (by number of orders)
SELECT 
    s.name,
    s.student_id,
    s.department,
    COUNT(o.id) as total_orders,
    SUM(o.total_value) as total_borrowed_value
FROM students s
JOIN orders o ON s.id = o.student_id
GROUP BY s.id, s.name, s.student_id, s.department
ORDER BY total_orders DESC
LIMIT 10;

-- Students with overdue items
SELECT DISTINCT
    s.name,
    s.student_id,
    s.email,
    s.department,
    COUNT(*) as overdue_orders
FROM students s
JOIN orders o ON s.id = o.student_id
WHERE o.status = 'approved' 
  AND o.expected_return_date < CURRENT_DATE
GROUP BY s.id, s.name, s.student_id, s.email, s.department
ORDER BY overdue_orders DESC;

-- ===== 9. USEFUL MAINTENANCE QUERIES =====

-- Find duplicate SKUs (should not exist due to unique constraint)
SELECT sku, COUNT(*) as count
FROM products
GROUP BY sku
HAVING COUNT(*) > 1;

-- Products without categories
SELECT name, sku, unit_price
FROM products
WHERE category_id IS NULL AND status = 'active';

-- Orders without items (data integrity check)
SELECT o.order_number, o.status, o.total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.order_id IS NULL;

-- ===== 10. SEARCH QUERIES (Replace 'SEARCH_TERM' with actual term) =====

-- Search products by name or SKU
SELECT name, sku, unit_price, quantity_available, location
FROM products
WHERE (LOWER(name) LIKE LOWER('%SEARCH_TERM%') 
       OR LOWER(sku) LIKE LOWER('%SEARCH_TERM%'))
  AND status = 'active'
ORDER BY name;

-- Search students by name or email
SELECT name, student_id, email, department
FROM students
WHERE (LOWER(name) LIKE LOWER('%SEARCH_TERM%')
       OR LOWER(email) LIKE LOWER('%SEARCH_TERM%'))
  AND is_active = true
ORDER BY name;

-- ===== 11. SUMMARY DASHBOARD QUERY =====
-- This gives you a complete overview in one query
SELECT 
    'Total Active Products' as metric, COUNT(*)::text as value FROM products WHERE status = 'active'
UNION ALL
SELECT 'Total Students', COUNT(*)::text FROM students WHERE is_active = true
UNION ALL  
SELECT 'Pending Orders', COUNT(*)::text FROM orders WHERE status = 'pending'
UNION ALL
SELECT 'Approved Orders', COUNT(*)::text FROM orders WHERE status = 'approved'
UNION ALL
SELECT 'Total Inventory Value', CONCAT('$', ROUND(SUM(quantity_available * unit_price), 2)::text) FROM products WHERE status = 'active'
UNION ALL
SELECT 'Overdue Orders', COUNT(*)::text FROM orders WHERE status = 'approved' AND expected_return_date < CURRENT_DATE;
