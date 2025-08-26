-- Complete Invoice System Integration
-- Run this to add invoice functionality to existing database

-- First, apply the invoice schema
\i 'C:\Users\User\inventory1\backend\invoice_schema.sql'

-- Create sample invoices for existing orders
INSERT INTO invoices (
    order_id,
    student_id,
    invoice_type,
    status,
    total_items,
    due_date,
    issued_by,
    notes
)
SELECT 
    o.id,
    o.student_id,
    'lending',
    CASE 
        WHEN o.status = 'approved' THEN 'issued'
        WHEN o.status = 'completed' THEN 'acknowledged'
        ELSE 'draft'
    END,
    o.total_items,
    o.expected_return_date,
    'System Administrator',
    'Auto-generated invoice for order ' || o.order_number
FROM orders o
WHERE NOT EXISTS (
    SELECT 1 FROM invoices i WHERE i.order_id = o.id
)
AND o.status IN ('approved', 'completed');

-- Create invoice items for each invoice
INSERT INTO invoice_items (
    invoice_id,
    product_id,
    order_item_id,
    product_name,
    product_sku,
    quantity,
    unit_value,
    total_value,
    lending_duration_days,
    expected_return_date
)
SELECT 
    i.id,
    oi.product_id,
    oi.id,
    p.name,
    p.sku,
    oi.quantity_approved,
    p.unit_price,
    oi.quantity_approved * p.unit_price,
    CASE 
        WHEN o.expected_return_date IS NOT NULL AND o.requested_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (o.expected_return_date - o.requested_date))
        ELSE 30
    END,
    o.expected_return_date
FROM invoices i
JOIN orders o ON i.order_id = o.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id AND ii.order_item_id = oi.id
);

-- Update invoice totals
UPDATE invoices SET 
    total_value = (
        SELECT COALESCE(SUM(total_value), 0)
        FROM invoice_items 
        WHERE invoice_id = invoices.id
    ),
    total_items = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM invoice_items 
        WHERE invoice_id = invoices.id
    );

-- Create some sample acknowledgments for completed orders
INSERT INTO student_acknowledgments (
    invoice_id,
    student_id,
    acknowledgment_type,
    acknowledgment_method,
    acknowledgment_location,
    notes
)
SELECT 
    i.id,
    i.student_id,
    'receipt',
    'in_person',
    'Equipment Room',
    'Received equipment in good condition'
FROM invoices i
JOIN orders o ON i.order_id = o.id
WHERE o.status = 'completed'
AND NOT EXISTS (
    SELECT 1 FROM student_acknowledgments sa WHERE sa.invoice_id = i.id
)
LIMIT 5;

-- Add some sample physical invoice captures for demonstration
UPDATE invoices SET 
    has_physical_copy = true,
    physical_invoice_captured = (RANDOM() > 0.5),
    physical_invoice_notes = 'Physical copy available in office'
WHERE invoice_type = 'lending'
AND status = 'issued';

-- Create comprehensive view for invoice analytics
CREATE OR REPLACE VIEW invoice_analytics AS
SELECT 
    -- Basic counts
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_invoices,
    COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged_invoices,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_invoices,
    
    -- Physical invoice stats
    COUNT(CASE WHEN has_physical_copy THEN 1 END) as physical_copies,
    COUNT(CASE WHEN physical_invoice_captured THEN 1 END) as physical_captured,
    
    -- Due date analysis
    COUNT(CASE WHEN status = 'issued' AND due_date > CURRENT_DATE THEN 1 END) as pending_returns,
    COUNT(CASE WHEN status = 'issued' AND due_date < CURRENT_DATE THEN 1 END) as overdue_returns,
    
    -- Financial totals
    COALESCE(SUM(total_value), 0) as total_lending_value,
    COALESCE(SUM(damage_fee), 0) as total_damage_fees,
    COALESCE(SUM(replacement_fee), 0) as total_replacement_fees,
    
    -- Type breakdown
    COUNT(CASE WHEN invoice_type = 'lending' THEN 1 END) as lending_invoices,
    COUNT(CASE WHEN invoice_type = 'return' THEN 1 END) as return_invoices,
    COUNT(CASE WHEN invoice_type = 'damage' THEN 1 END) as damage_invoices,
    COUNT(CASE WHEN invoice_type = 'replacement' THEN 1 END) as replacement_invoices,
    
    -- Recent activity
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
    
    -- Acknowledgment stats
    (SELECT COUNT(*) FROM student_acknowledgments) as total_acknowledgments,
    (SELECT COUNT(*) FROM invoice_images) as total_images
FROM invoices;

-- Create a function to automatically create invoices for new approved orders
CREATE OR REPLACE FUNCTION auto_create_invoice_for_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create invoice when order moves from pending to approved
    IF OLD.status = 'pending' AND NEW.status = 'approved' AND NEW.order_type = 'lending' THEN
        -- Insert the invoice
        INSERT INTO invoices (
            order_id,
            student_id,
            invoice_type,
            status,
            total_items,
            due_date,
            issued_by,
            notes
        ) VALUES (
            NEW.id,
            NEW.student_id,
            'lending',
            'issued',
            NEW.total_items,
            NEW.expected_return_date,
            NEW.approved_by,
            'Auto-generated lending invoice'
        );
        
        -- Create invoice items
        INSERT INTO invoice_items (
            invoice_id,
            product_id,
            order_item_id,
            product_name,
            product_sku,
            quantity,
            unit_value,
            total_value,
            expected_return_date
        )
        SELECT 
            i.id,
            oi.product_id,
            oi.id,
            p.name,
            p.sku,
            oi.quantity_approved,
            p.unit_price,
            oi.quantity_approved * p.unit_price,
            NEW.expected_return_date
        FROM invoices i
        JOIN order_items oi ON NEW.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE i.order_id = NEW.id
        AND i.invoice_type = 'lending';
        
        -- Log the transaction
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            new_status,
            performed_by,
            changes_summary
        )
        SELECT 
            id,
            'auto_created',
            'issued',
            NEW.approved_by,
            'Invoice automatically created when order was approved'
        FROM invoices
        WHERE order_id = NEW.id
        AND invoice_type = 'lending';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS auto_create_invoice_trigger ON orders;
CREATE TRIGGER auto_create_invoice_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_invoice_for_order();

-- Create function to handle invoice status changes
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF OLD.status != NEW.status THEN
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            previous_status,
            new_status,
            performed_by,
            changes_summary
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status,
            NEW.status,
            'System',
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    
    -- Log acknowledgment changes
    IF OLD.acknowledged_by_student = false AND NEW.acknowledged_by_student = true THEN
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            performed_by,
            changes_summary
        ) VALUES (
            NEW.id,
            'acknowledged',
            'Student',
            'Invoice acknowledged by student'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS log_invoice_changes_trigger ON invoices;
CREATE TRIGGER log_invoice_changes_trigger
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_status_change();

-- Update the orders table to link with invoices in views
CREATE OR REPLACE VIEW order_invoice_summary AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    o.student_id,
    s.name as student_name,
    s.department,
    o.total_items,
    o.total_value as order_value,
    o.requested_date,
    o.expected_return_date,
    
    -- Invoice information
    i.id as invoice_id,
    i.invoice_number,
    i.status as invoice_status,
    i.issue_date,
    i.acknowledgment_date,
    i.physical_invoice_captured,
    i.acknowledged_by_student,
    
    -- Counts
    (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as invoice_item_count,
    (SELECT COUNT(*) FROM invoice_images WHERE invoice_id = i.id) as image_count,
    (SELECT COUNT(*) FROM student_acknowledgments WHERE invoice_id = i.id) as acknowledgment_count
    
FROM orders o
LEFT JOIN students s ON o.student_id = s.id
LEFT JOIN invoices i ON o.id = i.order_id
ORDER BY o.created_at DESC;

-- Create indexes for better performance on invoice queries
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_acknowledged ON invoices(acknowledged_by_student);
CREATE INDEX IF NOT EXISTS idx_invoices_physical_captured ON invoices(physical_invoice_captured);

-- Insert some sample data for testing
DO $$
DECLARE
    sample_invoice_id UUID;
BEGIN
    -- Get a random invoice ID for testing
    SELECT id INTO sample_invoice_id FROM invoices LIMIT 1;
    
    IF sample_invoice_id IS NOT NULL THEN
        -- Insert sample transaction log
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            new_status,
            performed_by,
            changes_summary
        ) VALUES (
            sample_invoice_id,
            'sample_data',
            'issued',
            'System Setup',
            'Sample transaction for testing invoice system'
        );
        
        -- Mark one invoice as having physical copy captured
        UPDATE invoices 
        SET 
            has_physical_copy = true,
            physical_invoice_captured = true,
            physical_invoice_notes = 'Sample physical invoice for demonstration'
        WHERE id = sample_invoice_id;
    END IF;
END $$;

-- Final verification query
SELECT 
    'Invoice System Installation Complete' as status,
    (SELECT COUNT(*) FROM invoices) as total_invoices,
    (SELECT COUNT(*) FROM invoice_items) as total_invoice_items,
    (SELECT COUNT(*) FROM invoice_images) as total_images,
    (SELECT COUNT(*) FROM student_acknowledgments) as total_acknowledgments,
    (SELECT COUNT(*) FROM invoice_transactions) as total_transactions;
