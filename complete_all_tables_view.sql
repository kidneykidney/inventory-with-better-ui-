-- =========================================
-- COMPLETE ALL TABLES VIEW - INCLUDING INVOICE DATA
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
    CONCAT('Invoices: ', (SELECT COUNT(*) FROM invoices)) as info5,
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
    '' as info5,
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
    '' as info5,
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
    '' as info5,
    CONCAT('Orders: ', COUNT(DISTINCT o.id), ' | Invoices: ', COUNT(DISTINCT i.id), ' | Value: $', 
           COALESCE(ROUND(SUM(DISTINCT o.total_value) + SUM(DISTINCT i.total_value), 2), 0)) as financial_info,
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
    '' as info5,
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
    '' as info5,
    CONCAT('$', oi.unit_price, ' x ', oi.quantity_requested, ' = $', oi.total_price) as financial_info,
    6 as sort_order
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN students s ON o.student_id = s.id
JOIN products p ON oi.product_id = p.id

UNION ALL

-- 🧾 INVOICES
SELECT 
    'INVOICE' as table_type,
    CONCAT('Invoice #', i.invoice_number),
    s.name as info1,
    CONCAT('Type: ', UPPER(COALESCE(i.invoice_type, 'Standard')), ' | Status: ', UPPER(i.status)) as info2,
    CONCAT('Items: ', i.total_items, ' | Fee: $', COALESCE(i.lending_fee, 0)) as info3,
    CONCAT('Issue: ', i.issue_date::date, ' | Due: ', COALESCE(i.due_date::date::text, 'N/A')) as info4,
    CONCAT('OCR: ', CASE WHEN i.physical_invoice_captured THEN '✅' ELSE '❌' END, 
           ' | Ack: ', CASE WHEN i.acknowledged_by_student THEN '✅' ELSE '❌' END) as info5,
    CONCAT('$', i.total_value, 
           CASE 
               WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' 
               THEN ' | ⚠️ OVERDUE'
               WHEN i.damage_fee > 0 THEN CONCAT(' | Damage: $', i.damage_fee)
               WHEN i.replacement_fee > 0 THEN CONCAT(' | Replace: $', i.replacement_fee)
               ELSE ''
           END) as financial_info,
    7 as sort_order
FROM invoices i
JOIN students s ON i.student_id = s.id

UNION ALL

-- 📄 INVOICE ITEMS
SELECT 
    'INVOICE_ITEM' as table_type,
    ii.product_name,
    CONCAT('Invoice #', i.invoice_number) as info1,
    s.name as info2,
    CONCAT('SKU: ', ii.product_sku, ' | Qty: ', ii.quantity) as info3,
    CONCAT('Duration: ', COALESCE(ii.lending_duration_days::text, 'N/A'), ' days') as info4,
    CONCAT('Return: ', CASE 
        WHEN ii.actual_return_date IS NOT NULL THEN CONCAT('✅ ', ii.actual_return_date::date)
        WHEN ii.expected_return_date IS NOT NULL THEN CONCAT('📅 ', ii.expected_return_date::date)
        ELSE '❌ Not set'
    END) as info5,
    CONCAT('$', ii.unit_value, ' x ', ii.quantity, ' = $', ii.total_value,
           CASE 
               WHEN ii.damage_fee > 0 THEN CONCAT(' + Damage: $', ii.damage_fee)
               WHEN ii.replacement_fee > 0 THEN CONCAT(' + Replace: $', ii.replacement_fee)
               ELSE ''
           END) as financial_info,
    8 as sort_order
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN students s ON i.student_id = s.id

UNION ALL

-- 🖼️ INVOICE IMAGES (OCR Data)
SELECT 
    'INVOICE_IMAGE' as table_type,
    CONCAT('Image #', img.id),
    CONCAT('Invoice #', i.invoice_number) as info1,
    s.name as info2,
    CONCAT('File: ', COALESCE(img.file_name, 'Unknown')) as info3,
    CONCAT('OCR Status: ', CASE WHEN img.ocr_extracted THEN '✅ Extracted' ELSE '❌ Pending' END) as info4,
    CONCAT('Confidence: ', COALESCE(img.ocr_confidence::text, 'N/A'), '%') as info5,
    CONCAT('Size: ', COALESCE(ROUND(img.file_size_bytes/1024.0, 1), 0), ' KB | ', 
           UPPER(COALESCE(img.file_type, 'unknown'))) as financial_info,
    9 as sort_order
FROM invoice_images img
JOIN invoices i ON img.invoice_id = i.id
JOIN students s ON i.student_id = s.id

UNION ALL

-- 💰 INVOICE TRANSACTIONS
SELECT 
    'INVOICE_TRANSACTION' as table_type,
    CONCAT('Transaction #', it.transaction_number),
    CONCAT('Invoice #', i.invoice_number) as info1,
    s.name as info2,
    CONCAT('Type: ', UPPER(it.transaction_type)) as info3,
    CONCAT('Method: ', UPPER(COALESCE(it.payment_method, 'N/A'))) as info4,
    CONCAT('Date: ', it.transaction_date::date) as info5,
    CONCAT('$', it.amount, ' | Status: ', UPPER(it.status)) as financial_info,
    10 as sort_order
FROM invoice_transactions it
JOIN invoices i ON it.invoice_id = i.id
JOIN students s ON i.student_id = s.id

ORDER BY sort_order, name;

-- =========================================
-- RESULT COLUMNS:
-- table_type: Which table the data comes from
-- name: Main identifier (invoice number, product name, student name, etc.)
-- info1: First piece of detailed information
-- info2: Second piece of detailed information  
-- info3: Third piece of detailed information
-- info4: Fourth piece of detailed information
-- info5: Fifth piece of detailed information (NEW - for invoice-specific data)
-- financial_info: Money-related information or status
-- =========================================

-- 📋 SUMMARY OF NEW INVOICE SECTIONS:
-- INVOICE: Shows invoice overview with OCR status and acknowledgment
-- INVOICE_ITEM: Individual items in each invoice with return status
-- INVOICE_IMAGE: OCR processing status and file information
-- INVOICE_TRANSACTION: Payment and transaction details
-- =========================================
