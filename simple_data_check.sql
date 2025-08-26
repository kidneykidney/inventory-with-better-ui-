-- =========================================
-- SIMPLE DATA CHECK - See what's in your database
-- =========================================

-- Check what data exists
SELECT 'COUNTS' as type, 'Data Summary' as name,
       CONCAT('Categories: ', (SELECT COUNT(*) FROM categories)) as info1,
       CONCAT('Products: ', (SELECT COUNT(*) FROM products)) as info2,
       CONCAT('Students: ', (SELECT COUNT(*) FROM students)) as info3,
       CONCAT('Orders: ', (SELECT COUNT(*) FROM orders), ' | Invoices: ', (SELECT COUNT(*) FROM invoices)) as info4

UNION ALL

-- Show actual categories
SELECT 'CATEGORY' as type, c.name, 
       COALESCE(c.description, 'No description') as info1,
       c.id::text as info2,
       c.created_at::text as info3,
       'Category Data' as info4
FROM categories c

UNION ALL

-- Show actual products  
SELECT 'PRODUCT' as type, p.name,
       CONCAT('SKU: ', p.sku) as info1,
       CONCAT('Stock: ', p.quantity_available, '/', p.quantity_total) as info2,
       CONCAT('Price: $', p.unit_price) as info3,
       COALESCE(p.location, 'No location') as info4
FROM products p

UNION ALL

-- Show actual students
SELECT 'STUDENT' as type, s.name,
       s.student_id as info1,
       s.email as info2,
       COALESCE(s.department, 'No department') as info3,
       CASE WHEN s.is_active THEN 'Active' ELSE 'Inactive' END as info4
FROM students s

ORDER BY type, name;
