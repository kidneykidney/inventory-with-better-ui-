-- Updated Unified Inventory Management Database Schema
-- This schema includes invoice integration and automatic invoice creation functionality

-- Create database (run this first)
-- CREATE DATABASE inventory_management;
-- \c inventory_management;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES Table (for product categorization)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS Table (main inventory items)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE NOT NULL, -- Stock Keeping Unit
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_total INTEGER NOT NULL DEFAULT 0,
    is_returnable BOOLEAN NOT NULL DEFAULT true, -- true = returnable, false = consumable
    unit_price DECIMAL(10,2) DEFAULT 0.00, -- for future cost tracking
    location VARCHAR(100), -- where it's stored
    minimum_stock_level INTEGER DEFAULT 0, -- for alerts
    image_url TEXT,
    specifications JSONB, -- flexible specs storage
    tags TEXT[], -- for search functionality
    status VARCHAR(50) DEFAULT 'active', -- active, discontinued, out_of_stock
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL, -- college student ID
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100) NOT NULL,
    year_of_study INTEGER,
    course VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVOICES Table (main invoice records) - ADDED FOR INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV001, INV002, etc.
    order_id UUID, -- Will be linked to orders table via foreign key after orders table is created
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    invoice_type VARCHAR(50) DEFAULT 'lending', -- lending, return, damage, replacement
    status VARCHAR(50) DEFAULT 'draft', -- draft, issued, acknowledged, archived
    
    -- Invoice Details
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0.00, -- Always 0 for lending invoices
    lending_fee DECIMAL(10,2) DEFAULT 0.00, -- Always 0 for free lending
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Dates
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP, -- Expected return date
    acknowledgment_date TIMESTAMP, -- When student acknowledged receipt
    
    -- Physical Invoice Management
    has_physical_copy BOOLEAN DEFAULT false,
    physical_invoice_captured BOOLEAN DEFAULT false,
    physical_invoice_image_url TEXT,
    physical_invoice_notes TEXT,
    
    -- Admin Information
    issued_by VARCHAR(200),
    acknowledged_by_student BOOLEAN DEFAULT false,
    student_signature_url TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ORDERS Table (main order/lending records) - UPDATED WITH INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- ORD001, ORD002, etc.
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- NEW: Link to auto-created invoice
    order_type VARCHAR(50) DEFAULT 'lending', -- lending, purchase, etc.
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, cancelled, overdue
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP,
    completed_date TIMESTAMP,
    expected_return_date TIMESTAMP, -- for returnable items
    actual_return_date TIMESTAMP,
    approved_by VARCHAR(200), -- admin/faculty name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Now add the foreign key constraint for order_id in invoices table
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- 6. ORDER_ITEMS Table (items in each order)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL,
    quantity_approved INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    is_returnable BOOLEAN NOT NULL, -- copied from product at time of order
    expected_return_date TIMESTAMP, -- specific return date for this item
    actual_return_date TIMESTAMP,
    return_condition VARCHAR(100), -- good, damaged, lost
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, issued, returned, lost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. INVOICE_ITEMS Table (items in each invoice) - ADDED FOR INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- Link to original order item
    
    -- Item Details
    product_name VARCHAR(200) NOT NULL, -- Snapshot at time of invoice
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_value DECIMAL(10,2) DEFAULT 0.00, -- Product value for reference
    total_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Lending Details
    lending_duration_days INTEGER,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    return_condition VARCHAR(100), -- good, damaged, lost, not_returned
    
    -- Fees (for damage/replacement invoices)
    damage_assessment TEXT,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_needed BOOLEAN DEFAULT false,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. INVOICE_IMAGES Table (for uploaded invoice photos) - ADDED FOR INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS invoice_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL, -- physical_invoice, signature, damage_photo, return_photo
    image_url TEXT NOT NULL,
    image_filename VARCHAR(255),
    image_size INTEGER, -- in bytes
    image_format VARCHAR(10), -- jpg, png, pdf
    
    -- Upload Details
    uploaded_by VARCHAR(200),
    upload_method VARCHAR(50), -- camera, file_upload, scan
    
    -- Image Metadata
    capture_timestamp TIMESTAMP,
    device_info JSONB, -- camera specs, location, etc.
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed
    ocr_text TEXT, -- extracted text from image
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. INVOICE_TRANSACTIONS Table (track invoice state changes) - ADDED FOR INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS invoice_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- created, issued, acknowledged, modified, archived
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by VARCHAR(200),
    
    -- Change Details
    changes_summary TEXT,
    change_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. STUDENT_ACKNOWLEDGMENTS Table (track student confirmations) - ADDED FOR INVOICE INTEGRATION
CREATE TABLE IF NOT EXISTS student_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    -- Acknowledgment Details
    acknowledgment_type VARCHAR(50) NOT NULL, -- receipt, return, damage, replacement
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_method VARCHAR(50), -- digital_signature, photo, email, in_person
    
    -- Digital Evidence
    signature_image_url TEXT,
    photo_evidence_url TEXT,
    digital_signature_data TEXT, -- base64 signature data
    
    -- Location and Context
    acknowledgment_location VARCHAR(200),
    witness_name VARCHAR(200),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. PRODUCT_TRANSACTIONS Table (track all stock movements)
CREATE TABLE IF NOT EXISTS product_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'stock_in', 'stock_out', 'adjustment', 'return'
    quantity_change INTEGER NOT NULL, -- positive for in, negative for out
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'manual', 'return', 'adjustment'
    reference_id UUID, -- order_id if related to order
    performed_by VARCHAR(200),
    notes TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. NOTIFICATIONS Table (for alerts and reminders)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'overdue', 'low_stock', 'return_reminder'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_table VARCHAR(50), -- 'orders', 'products', 'students'
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders(invoice_id); -- NEW INDEX
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_transactions_product_id ON product_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- NEW INVOICE INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_images_invoice_id ON invoice_images(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_images_image_type ON invoice_images(image_type);
CREATE INDEX IF NOT EXISTS idx_invoice_transactions_invoice_id ON invoice_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_student_acknowledgments_invoice_id ON student_acknowledgments(invoice_id);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic components and devices'),
('Tools', 'Hand tools and equipment'),
('Sensors', 'Various types of sensors'),
('Microcontrollers', 'Arduino, Raspberry Pi, etc.'),
('Cables & Connectors', 'Wires, cables, connectors'),
('Components', 'Resistors, capacitors, ICs, etc.'),
('Safety Equipment', 'Goggles, gloves, etc.'),
('Educational Kits', 'Learning and project kits')
ON CONFLICT (name) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next order number
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 
    INTO next_number 
    FROM orders 
    WHERE order_number ~ '^ORD[0-9]+$';
    
    -- Generate the order number
    NEW.order_number = 'ORD' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-generating order numbers
CREATE TRIGGER generate_order_number_trigger 
BEFORE INSERT ON orders 
FOR EACH ROW 
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION generate_order_number();

-- Create a function to automatically generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    prefix TEXT;
BEGIN
    -- Determine prefix based on invoice type
    CASE NEW.invoice_type
        WHEN 'lending' THEN prefix := 'LEN';
        WHEN 'return' THEN prefix := 'RET';
        WHEN 'damage' THEN prefix := 'DAM';
        WHEN 'replacement' THEN prefix := 'REP';
        ELSE prefix := 'INV';
    END CASE;
    
    -- Get the next invoice number for this type
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1 
    INTO next_number 
    FROM invoices 
    WHERE invoice_number ~ ('^' || prefix || '[0-9]+$');
    
    -- Generate the invoice number
    NEW.invoice_number = prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-generating invoice numbers
CREATE TRIGGER generate_invoice_number_trigger 
BEFORE INSERT ON invoices 
FOR EACH ROW 
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION generate_invoice_number();

-- Create a function to update product quantities when order items change
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new order item)
    IF TG_OP = 'INSERT' THEN
        -- Decrease available quantity
        UPDATE products 
        SET quantity_available = quantity_available - NEW.quantity_approved
        WHERE id = NEW.product_id;
        
        -- Log transaction
        INSERT INTO product_transactions (
            product_id, transaction_type, quantity_change, 
            quantity_before, quantity_after, reference_type, reference_id
        )
        SELECT 
            NEW.product_id, 'stock_out', -NEW.quantity_approved,
            p.quantity_available + NEW.quantity_approved,
            p.quantity_available,
            'order', NEW.order_id
        FROM products p WHERE p.id = NEW.product_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (quantity change)
    IF TG_OP = 'UPDATE' THEN
        -- Calculate quantity difference
        IF OLD.quantity_approved != NEW.quantity_approved THEN
            UPDATE products 
            SET quantity_available = quantity_available + OLD.quantity_approved - NEW.quantity_approved
            WHERE id = NEW.product_id;
        END IF;
        
        -- Handle returns
        IF OLD.quantity_returned != NEW.quantity_returned THEN
            UPDATE products 
            SET quantity_available = quantity_available + (NEW.quantity_returned - OLD.quantity_returned)
            WHERE id = NEW.product_id;
            
            -- Log return transaction
            INSERT INTO product_transactions (
                product_id, transaction_type, quantity_change, 
                quantity_before, quantity_after, reference_type, reference_id
            )
            SELECT 
                NEW.product_id, 'return', NEW.quantity_returned - OLD.quantity_returned,
                p.quantity_available - (NEW.quantity_returned - OLD.quantity_returned),
                p.quantity_available,
                'order', NEW.order_id
            FROM products p WHERE p.id = NEW.product_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (order item cancelled)
    IF TG_OP = 'DELETE' THEN
        -- Return quantity to available stock
        UPDATE products 
        SET quantity_available = quantity_available + OLD.quantity_approved - OLD.quantity_returned
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for automatic inventory updates
CREATE TRIGGER update_product_quantity_trigger 
AFTER INSERT OR UPDATE OR DELETE ON order_items 
FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- Create view for complete invoice information
CREATE OR REPLACE VIEW invoice_details AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_type,
    i.status,
    i.issue_date,
    i.due_date,
    i.acknowledgment_date,
    i.total_items,
    i.total_value,
    i.has_physical_copy,
    i.physical_invoice_captured,
    i.physical_invoice_image_url,
    
    -- Order Information
    o.order_number,
    o.status as order_status,
    o.requested_date,
    o.expected_return_date,
    
    -- Student Information
    s.name as student_name,
    s.student_id,
    s.email as student_email,
    s.department,
    s.year_of_study,
    
    -- Counts and Summaries
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as item_count,
    (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) as image_count,
    (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as acknowledgment_count,
    
    -- Latest acknowledgment
    (SELECT acknowledged_at FROM student_acknowledgments sa 
     WHERE sa.invoice_id = i.id 
     ORDER BY acknowledged_at DESC LIMIT 1) as latest_acknowledgment,
     
    i.created_at,
    i.updated_at
FROM invoices i
LEFT JOIN orders o ON i.order_id = o.id
LEFT JOIN students s ON i.student_id = s.id;

-- Add comments to document the schema
COMMENT ON TABLE orders IS 'Main order/lending records with automatic invoice integration';
COMMENT ON COLUMN orders.invoice_id IS 'Reference to automatically created invoice when order is approved';
COMMENT ON TABLE invoices IS 'Invoice records created automatically when orders are approved';
COMMENT ON TABLE invoice_items IS 'Items in each invoice, linked to original order items';

-- Final success message
SELECT 'Unified Inventory + Invoice Management Schema created successfully!' as message;
SELECT 'New features: Automatic invoice creation when orders are approved' as feature_info;
