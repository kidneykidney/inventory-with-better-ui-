-- =========================================
-- COMPLETE INVENTORY SYSTEM VIEW WITH INVOICES
-- Copy and paste this into pgAdmin Query Editor
-- =========================================

-- 📊 SYSTEM OVERVIEW
SELECT 
    'SYSTEM_OVERVIEW' as table_type,
    'Database Summary' as name,
    CONCAT('Categories: ', (SELECT COUNT(*) FROM categories)) as info1,
    CONCAT('Products: ', (SELECT COUNT(*) FROM products)) as info2,
    CONCAT('Students: ', (SELECT COUNT(*) FROM students)) as info3,
    CONCAT('Orders: ', (SELECT COUNT(*) FROM orders), ' | Invoices: ', (SELECT COUNT(*) FROM invoices)) as info4,
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
    CONCAT('Orders: ', COUNT(o.id), ' | Invoices: ', COUNT(i.id), ' | Value: $', COALESCE(ROUND(SUM(o.total_value), 2), 0)) as financial_info,
    4 as sort_order
FROM students s
LEFT JOIN orders o ON s.id = o.student_id
LEFT JOIN invoices i ON s.id = i.student_id
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

-- 🧾 INVOICES
SELECT 
    'INVOICE' as table_type,
    CONCAT('Invoice #', i.invoice_number),
    s.name as info1,
    CONCAT('Status: ', UPPER(i.status)) as info2,
    CONCAT('Items: ', i.total_items, ' | Type: ', UPPER(i.invoice_type)) as info3,
    CONCAT('Issued: ', i.issue_date::date, 
           CASE WHEN i.due_date IS NOT NULL 
           THEN CONCAT(' | Due: ', i.due_date::date) 
           ELSE '' END) as info4,
    CONCAT('$', i.total_value, 
           CASE 
               WHEN i.has_physical_copy THEN ' | 📄 Physical'
               ELSE ' | 💻 Digital'
           END,
           CASE 
               WHEN i.acknowledged_by_student THEN ' | ✅ Acknowledged'
               ELSE ' | ⏳ Pending'
           END) as financial_info,
    6 as sort_order
FROM invoices i
JOIN students s ON i.student_id = s.id

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
    7 as sort_order
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN students s ON o.student_id = s.id
JOIN products p ON oi.product_id = p.id

UNION ALL

-- 📋 INVOICE ITEMS
SELECT 
    'INVOICE_ITEM' as table_type,
    p.name,
    CONCAT('Invoice #', i.invoice_number) as info1,
    s.name as info2,
    CONCAT('Qty: ', ii.quantity, ' | Unit: $', ii.unit_value) as info3,
    CONCAT('Added: ', ii.created_at::date) as info4,
    CONCAT('Total: $', ii.total_value) as financial_info,
    8 as sort_order
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN students s ON i.student_id = s.id
JOIN products p ON ii.product_id = p.id

UNION ALL

-- 📸 INVOICE IMAGES
SELECT 
    'INVOICE_IMAGE' as table_type,
    CONCAT('Image - ', UPPER(ii.image_type)),
    CONCAT('Invoice #', i.invoice_number) as info1,
    s.name as info2,
    CONCAT('Uploaded by: ', COALESCE(ii.uploaded_by, 'Unknown')) as info3,
    CONCAT('File: ', COALESCE(ii.image_filename, 'No filename')) as info4,
    CASE 
        WHEN ii.image_filename IS NOT NULL THEN '✅ File Stored'
        ELSE '❌ Missing File'
    END as financial_info,
    9 as sort_order
FROM invoice_images ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN students s ON i.student_id = s.id

ORDER BY sort_order, name;

-- =========================================
-- VERIFICATION QUERIES FOR DELETED INVOICES
-- =========================================

-- Quick check for deleted invoices (should return 0 for each)
SELECT 'DELETED INVOICE CHECK' as check_type, 
       '75b00103-8449-48c1-a78e-9b4a41a38050' as invoice_id, 
       COUNT(*) as found_count
FROM invoices WHERE id = '75b00103-8449-48c1-a78e-9b4a41a38050'
UNION ALL
SELECT 'DELETED INVOICE CHECK' as check_type, 
       '4eb46d76-f7f0-4357-b816-f77d8e684925' as invoice_id, 
       COUNT(*) as found_count
FROM invoices WHERE id = '4eb46d76-f7f0-4357-b816-f77d8e684925';

-- =========================================
-- RESULT COLUMNS EXPLANATION:
-- table_type: Which table the data comes from
-- name: Main identifier (category name, product name, student name, etc.)
-- info1: First piece of detailed information
-- info2: Second piece of detailed information  
-- info3: Third piece of detailed information
-- info4: Fourth piece of detailed information
-- financial_info: Money-related information or status
-- =========================================
