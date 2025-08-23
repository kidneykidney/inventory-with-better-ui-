-- Sample orders data for testing

-- Create some sample orders
INSERT INTO orders (id, student_id, status, requested_date, expected_return_date, notes, total_value, approved_by, approved_date) VALUES
-- Order 1: Pending order for John Doe
('11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM students WHERE student_id = 'STU001' LIMIT 1),
 'pending', 
 '2024-08-20 10:00:00', 
 '2024-08-30 10:00:00',
 'Urgently needed for project work',
 150.00,
 NULL,
 NULL),

-- Order 2: Approved order for the same student
('22222222-2222-2222-2222-222222222222', 
 (SELECT id FROM students WHERE student_id = 'STU001' LIMIT 1),
 'approved', 
 '2024-08-18 14:30:00', 
 '2024-08-28 14:30:00',
 'For upcoming presentation',
 75.50,
 'Admin User',
 '2024-08-19 09:00:00'),

-- Order 3: Completed order
('33333333-3333-3333-3333-333333333333', 
 (SELECT id FROM students WHERE student_id = 'STU001' LIMIT 1),
 'completed', 
 '2024-08-15 11:15:00', 
 '2024-08-25 11:15:00',
 'Completed successfully',
 220.75,
 'Admin User',
 '2024-08-16 10:00:00');

-- Create order items for these orders
INSERT INTO order_items (id, order_id, product_id, quantity_requested, quantity_approved, status, notes) VALUES
-- Items for Order 1 (Pending)
('aaaa1111-1111-1111-1111-111111111111', 
 '11111111-1111-1111-1111-111111111111',
 (SELECT id FROM products WHERE sku = 'LAP001' LIMIT 1),
 1, 
 NULL,
 'pending',
 'High priority item'),

('aaaa2222-2222-2222-2222-222222222222', 
 '11111111-1111-1111-1111-111111111111',
 (SELECT id FROM products WHERE sku = 'MOU001' LIMIT 1),
 2, 
 NULL,
 'pending',
 NULL),

-- Items for Order 2 (Approved)
('bbbb1111-1111-1111-1111-111111111111', 
 '22222222-2222-2222-2222-222222222222',
 (SELECT id FROM products WHERE sku = 'KEY001' LIMIT 1),
 1, 
 1,
 'approved',
 'Approved for pickup'),

('bbbb2222-2222-2222-2222-222222222222', 
 '22222222-2222-2222-2222-222222222222',
 (SELECT id FROM products WHERE sku = 'MOU001' LIMIT 1),
 1, 
 1,
 'approved',
 'Ready for collection'),

-- Items for Order 3 (Completed)
('cccc1111-1111-1111-1111-111111111111', 
 '33333333-3333-3333-3333-333333333333',
 (SELECT id FROM products WHERE sku = 'LAP001' LIMIT 1),
 1, 
 1,
 'returned',
 'Returned in good condition'),

('cccc2222-2222-2222-2222-222222222222', 
 '33333333-3333-3333-3333-333333333333',
 (SELECT id FROM products WHERE sku = 'MON001' LIMIT 1),
 1, 
 1,
 'returned',
 'Returned with minor scratches');

-- Update order totals and item counts (this would normally be handled by triggers)
UPDATE orders SET 
    total_items = (
        SELECT COUNT(*) 
        FROM order_items 
        WHERE order_id = orders.id
    ),
    total_value = (
        SELECT COALESCE(SUM(p.unit_price * oi.quantity_requested), 0)
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = orders.id
    );

-- Create some inventory transactions for approved/completed orders
INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, reference_type, reference_id, notes) VALUES
-- Transaction for Order 2 items
('t1111111-1111-1111-1111-111111111111',
 (SELECT id FROM products WHERE sku = 'KEY001' LIMIT 1),
 'checkout',
 1,
 'order',
 '22222222-2222-2222-2222-222222222222',
 'Checked out for Order #ORD-2024-0002'),

('t2222222-2222-2222-2222-222222222222',
 (SELECT id FROM products WHERE sku = 'MOU001' LIMIT 1),
 'checkout',
 1,
 'order',
 '22222222-2222-2222-2222-222222222222',
 'Checked out for Order #ORD-2024-0002'),

-- Transaction for Order 3 items (checkout and return)
('t3333333-3333-3333-3333-333333333333',
 (SELECT id FROM products WHERE sku = 'LAP001' LIMIT 1),
 'checkout',
 1,
 'order',
 '33333333-3333-3333-3333-333333333333',
 'Checked out for Order #ORD-2024-0003'),

('t4444444-4444-4444-4444-444444444444',
 (SELECT id FROM products WHERE sku = 'LAP001' LIMIT 1),
 'return',
 1,
 'order',
 '33333333-3333-3333-3333-333333333333',
 'Returned from Order #ORD-2024-0003'),

('t5555555-5555-5555-5555-555555555555',
 (SELECT id FROM products WHERE sku = 'MON001' LIMIT 1),
 'checkout',
 1,
 'order',
 '33333333-3333-3333-3333-333333333333',
 'Checked out for Order #ORD-2024-0003'),

('t6666666-6666-6666-6666-666666666666',
 (SELECT id FROM products WHERE sku = 'MON001' LIMIT 1),
 'return',
 1,
 'order',
 '33333333-3333-3333-3333-333333333333',
 'Returned from Order #ORD-2024-0003');
