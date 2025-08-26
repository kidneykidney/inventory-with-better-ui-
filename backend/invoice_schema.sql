-- Invoice System Database Schema
-- Extension for invoice billing system with camera upload functionality

-- 1. INVOICES Table (main invoice records)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV001, INV002, etc.
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
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

-- 2. INVOICE_ITEMS Table (items in each invoice)
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

-- 3. INVOICE_IMAGES Table (for uploaded invoice photos)
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

-- 4. INVOICE_TRANSACTIONS Table (track invoice state changes)
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

-- 5. STUDENT_ACKNOWLEDGMENTS Table (track student confirmations)
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

-- Create indexes for better performance
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_invoice_images_invoice_id ON invoice_images(invoice_id);
CREATE INDEX idx_invoice_images_image_type ON invoice_images(image_type);
CREATE INDEX idx_invoice_transactions_invoice_id ON invoice_transactions(invoice_id);
CREATE INDEX idx_student_acknowledgments_invoice_id ON student_acknowledgments(invoice_id);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create a function to auto-create invoice when order is approved
CREATE OR REPLACE FUNCTION create_lending_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create invoice for approved lending orders
    IF NEW.status = 'approved' AND NEW.order_type = 'lending' AND OLD.status = 'pending' THEN
        INSERT INTO invoices (
            order_id,
            student_id,
            invoice_type,
            status,
            total_items,
            due_date,
            issued_by
        )
        VALUES (
            NEW.id,
            NEW.student_id,
            'lending',
            'issued',
            NEW.total_items,
            NEW.expected_return_date,
            NEW.approved_by
        );
        
        -- Log the transaction
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            new_status,
            performed_by,
            changes_summary
        )
        SELECT 
            i.id,
            'created',
            'issued',
            NEW.approved_by,
            'Auto-generated lending invoice for approved order'
        FROM invoices i
        WHERE i.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-creating lending invoices
CREATE TRIGGER create_lending_invoice_trigger 
AFTER UPDATE ON orders 
FOR EACH ROW 
EXECUTE FUNCTION create_lending_invoice();

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

-- Insert some sample data to demonstrate the system
INSERT INTO invoices (
    order_id,
    student_id,
    invoice_type,
    status,
    total_items,
    issued_by,
    notes
) VALUES (
    -- This will use the first available order and student
    (SELECT id FROM orders LIMIT 1),
    (SELECT id FROM students LIMIT 1),
    'lending',
    'issued',
    1,
    'System Administrator',
    'Sample lending invoice for testing'
) ON CONFLICT DO NOTHING;
