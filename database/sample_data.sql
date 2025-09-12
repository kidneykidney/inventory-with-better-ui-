-- Sample Data for Testing
-- Run this after the main database initialization to add sample data

-- Sample products
INSERT INTO products (name, description, sku, category_id, quantity, min_stock_level, unit_price, lending_price, replacement_cost, location) 
SELECT 
    'Arduino Uno R3', 
    'Microcontroller board based on ATmega328P', 
    'ARD-UNO-001', 
    c.id, 
    25, 
    5, 
    15.00, 
    2.00, 
    18.00, 
    'Electronics Lab - Shelf A1'
FROM categories c WHERE c.name = 'Electronics'
LIMIT 1;

INSERT INTO products (name, description, sku, category_id, quantity, min_stock_level, unit_price, lending_price, replacement_cost, location)
SELECT 
    'Digital Multimeter', 
    'Professional digital multimeter with auto-ranging', 
    'DMM-PRO-001', 
    c.id, 
    10, 
    2, 
    45.00, 
    5.00, 
    55.00, 
    'Electronics Lab - Cabinet B'
FROM categories c WHERE c.name = 'Electronics'
LIMIT 1;

INSERT INTO products (name, description, sku, category_id, quantity, min_stock_level, unit_price, lending_price, replacement_cost, location)
SELECT 
    'Laptop - Dell Inspiron', 
    'Dell Inspiron 15 3000 Series, 8GB RAM, 256GB SSD', 
    'LAP-DELL-001', 
    c.id, 
    8, 
    1, 
    550.00, 
    25.00, 
    650.00, 
    'Computer Lab - Station 1-8'
FROM categories c WHERE c.name = 'Computers'
LIMIT 1;

INSERT INTO products (name, description, sku, category_id, quantity, min_stock_level, unit_price, lending_price, replacement_cost, location)
SELECT 
    'Oscilloscope - Handheld', 
    'Digital handheld oscilloscope 100MHz', 
    'OSC-HND-001', 
    c.id, 
    3, 
    1, 
    320.00, 
    15.00, 
    380.00, 
    'Electronics Lab - Secure Cabinet'
FROM categories c WHERE c.name = 'Laboratory Equipment'
LIMIT 1;

INSERT INTO products (name, description, sku, category_id, quantity, min_stock_level, unit_price, lending_price, replacement_cost, location)
SELECT 
    'Soldering Iron Kit', 
    'Professional soldering iron with accessories', 
    'SOL-KIT-001', 
    c.id, 
    15, 
    3, 
    35.00, 
    3.00, 
    42.00, 
    'Electronics Lab - Tool Cabinet'
FROM categories c WHERE c.name = 'Tools'
LIMIT 1;

-- Sample students
INSERT INTO students (student_id, name, email, phone, department, year_of_study, course) VALUES
('STU001001', 'John Smith', 'john.smith@college.edu', '+1-555-0101', 'Computer Science', 3, 'Bachelor of Computer Science'),
('STU001002', 'Sarah Johnson', 'sarah.johnson@college.edu', '+1-555-0102', 'Electronics Engineering', 2, 'Bachelor of Electronics Engineering'),
('STU001003', 'Michael Brown', 'michael.brown@college.edu', '+1-555-0103', 'Mechanical Engineering', 4, 'Bachelor of Mechanical Engineering'),
('STU001004', 'Emily Davis', 'emily.davis@college.edu', '+1-555-0104', 'Computer Science', 1, 'Bachelor of Computer Science'),
('STU001005', 'David Wilson', 'david.wilson@college.edu', '+1-555-0105', 'Electronics Engineering', 3, 'Bachelor of Electronics Engineering');

-- Sample orders (this will trigger invoice creation)
INSERT INTO orders (order_number, student_id, order_type, status, requested_date, notes)
SELECT 
    'ORD-2025-001',
    s.id,
    'lending',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'Arduino project for embedded systems course'
FROM students s WHERE s.student_id = 'STU001001'
LIMIT 1;

-- Sample order items
INSERT INTO order_items (order_id, product_id, quantity, lending_fee, notes)
SELECT 
    o.id,
    p.id,
    2,
    4.00,
    'For embedded systems project'
FROM orders o, products p 
WHERE o.order_number = 'ORD-2025-001' 
  AND p.sku = 'ARD-UNO-001'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, lending_fee, notes)
SELECT 
    o.id,
    p.id,
    1,
    3.00,
    'For circuit testing'
FROM orders o, products p 
WHERE o.order_number = 'ORD-2025-001' 
  AND p.sku = 'SOL-KIT-001'
LIMIT 1;

-- Approve the order (this will trigger automatic invoice creation)
UPDATE orders 
SET status = 'approved', 
    approved_date = CURRENT_TIMESTAMP,
    approved_by = 'admin'
WHERE order_number = 'ORD-2025-001';

-- Sample notifications
INSERT INTO notifications (type, title, message, recipient_type, priority) VALUES
('system', 'Database Initialized', 'Sample data has been loaded successfully', 'admin', 'normal'),
('inventory', 'Low Stock Alert', 'Oscilloscope - Handheld is running low (3 remaining)', 'admin', 'high'),
('order', 'New Order Pending', 'Order ORD-2025-001 requires approval', 'admin', 'normal');

-- Update system settings with realistic values
UPDATE system_settings SET value = '7' WHERE key = 'low_stock_threshold';
UPDATE system_settings SET value = '3.00' WHERE key = 'default_lending_fee';
UPDATE system_settings SET value = '21' WHERE key = 'max_lending_days';

-- Add some audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values) 
SELECT 
    u.id, 
    'INSERT', 
    'products', 
    'sample', 
    'Sample products created during initialization'
FROM users u WHERE u.username = 'admin'
LIMIT 1;

COMMIT;

-- Display summary
DO $$
BEGIN
    RAISE NOTICE '📊 Sample data loaded successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Students: 5 sample students added';
    RAISE NOTICE '📦 Products: 5 sample products added across all categories';
    RAISE NOTICE '📋 Orders: 1 sample order with automatic invoice generation';
    RAISE NOTICE '🔔 Notifications: 3 sample notifications added';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready for testing!';
    RAISE NOTICE '💡 Login with: admin / College@2025';
END $$;
