-- ===================================================================
-- LENDER SYSTEM DATABASE MIGRATION
-- ===================================================================
-- This migration adds the Lender management system to the existing
-- inventory management database, following the same patterns as Students
-- ===================================================================

-- Create Lenders table (similar to students table)
CREATE TABLE lenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    department VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    designation VARCHAR(100), -- Staff designation (Professor, Lab Assistant, etc.)
    employee_id VARCHAR(50), -- Employee ID number
    office_location VARCHAR(200), -- Office/Lab location
    authority_level VARCHAR(50) DEFAULT 'standard', -- standard, senior, admin
    can_approve_lending BOOLEAN DEFAULT true, -- Can this lender approve lending requests
    can_lend_high_value BOOLEAN DEFAULT false, -- Can lend high-value items
    max_lending_value DECIMAL(10,2) DEFAULT 1000.00, -- Maximum value they can lend
    emergency_contact VARCHAR(200),
    emergency_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add lender_id to orders table
ALTER TABLE orders ADD COLUMN lender_id UUID REFERENCES lenders(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN approved_by_lender UUID REFERENCES lenders(id) ON DELETE SET NULL;

-- Add lender_id to invoices table  
ALTER TABLE invoices ADD COLUMN lender_id UUID REFERENCES lenders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN issued_by_lender UUID REFERENCES lenders(id) ON DELETE SET NULL;

-- Create function to generate lender IDs (similar to student ID generation)
CREATE OR REPLACE FUNCTION generate_lender_id() 
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_id VARCHAR(50);
BEGIN
    -- Only generate if lender_id is null or empty
    IF NEW.lender_id IS NULL OR NEW.lender_id = '' THEN
        -- Get the next lender number
        SELECT COALESCE(MAX(CAST(SUBSTRING(lender_id FROM 'LEND([0-9]+)') AS INTEGER)), 0) + 1 
        INTO next_number 
        FROM lenders 
        WHERE lender_id ~ '^LEND[0-9]+$';
        
        -- Generate the lender ID
        NEW.lender_id = 'LEND' || LPAD(next_number::TEXT, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lender ID generation
CREATE TRIGGER generate_lender_id_trigger 
    BEFORE INSERT ON lenders 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_lender_id();

-- Create trigger for updated_at
CREATE TRIGGER update_lenders_updated_at 
    BEFORE UPDATE ON lenders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_lenders_lender_id ON lenders(lender_id);
CREATE INDEX idx_lenders_email ON lenders(email);
CREATE INDEX idx_lenders_name ON lenders(name);
CREATE INDEX idx_lenders_department ON lenders(department);
CREATE INDEX idx_lenders_employee_id ON lenders(employee_id);
CREATE INDEX idx_lenders_is_active ON lenders(is_active);

-- Unique constraints
CREATE UNIQUE INDEX lenders_lender_id_unique_when_not_empty 
    ON lenders(lender_id) 
    WHERE lender_id IS NOT NULL AND lender_id != '';
    
CREATE UNIQUE INDEX lenders_email_unique_when_not_empty 
    ON lenders(email) 
    WHERE email IS NOT NULL AND email != '';
    
CREATE UNIQUE INDEX lenders_employee_id_unique_when_not_empty 
    ON lenders(employee_id) 
    WHERE employee_id IS NOT NULL AND employee_id != '';

-- Add indexes for foreign keys
CREATE INDEX idx_orders_lender_id ON orders(lender_id);
CREATE INDEX idx_orders_approved_by_lender ON orders(approved_by_lender);
CREATE INDEX idx_invoices_lender_id ON invoices(lender_id);
CREATE INDEX idx_invoices_issued_by_lender ON invoices(issued_by_lender);

-- Update the invoice_details view to include lender information
DROP VIEW IF EXISTS invoice_details;
CREATE VIEW invoice_details AS
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
    i.lending_fee,
    i.damage_fee,
    i.replacement_fee,
    i.has_physical_copy,
    i.physical_invoice_captured,
    i.physical_invoice_image_url,
    i.issued_by,
    i.acknowledged_by_student,
    i.notes,
    o.order_number,
    o.status AS order_status,
    o.requested_date,
    o.expected_return_date,
    
    -- Student information
    CASE 
        WHEN i.use_student_override THEN i.student_name_override 
        ELSE s.name 
    END AS student_name,
    s.student_id,
    CASE 
        WHEN i.use_student_override THEN i.student_email_override 
        ELSE s.email 
    END AS student_email,
    CASE 
        WHEN i.use_student_override THEN i.student_department_override 
        ELSE s.department 
    END AS department,
    s.year_of_study,
    
    -- Lender information
    l.name AS lender_name,
    l.lender_id,
    l.email AS lender_email,
    l.department AS lender_department,
    l.designation AS lender_designation,
    l.office_location AS lender_office,
    il.name AS issued_by_lender_name,
    il.lender_id AS issued_by_lender_id,
    
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count,
    (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) AS image_count,
    (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) AS acknowledgment_count,
    (SELECT sa.acknowledged_at FROM student_acknowledgments sa WHERE sa.invoice_id = i.id ORDER BY sa.acknowledged_at DESC LIMIT 1) AS latest_acknowledgment,
    i.created_at,
    i.updated_at
FROM invoices i
LEFT JOIN orders o ON i.order_id = o.id
LEFT JOIN students s ON i.student_id = s.id
LEFT JOIN lenders l ON i.lender_id = l.id
LEFT JOIN lenders il ON i.issued_by_lender = il.id;

-- Create a function to find or create lender (similar to student function)
CREATE OR REPLACE FUNCTION find_or_create_lender(
    p_lender_id character varying,
    p_name character varying,
    p_email character varying,
    p_phone character varying DEFAULT NULL,
    p_department character varying DEFAULT 'Unknown',
    p_designation character varying DEFAULT NULL,
    p_employee_id character varying DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    existing_lender_uuid UUID;
    new_lender_uuid UUID;
BEGIN
    -- First try to find by lender_id
    IF p_lender_id IS NOT NULL AND p_lender_id != '' THEN
        SELECT id INTO existing_lender_uuid 
        FROM lenders 
        WHERE lender_id = p_lender_id 
        LIMIT 1;
        
        IF existing_lender_uuid IS NOT NULL THEN
            RETURN existing_lender_uuid;
        END IF;
    END IF;
    
    -- Then try to find by email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT id INTO existing_lender_uuid 
        FROM lenders 
        WHERE email = p_email 
        LIMIT 1;
        
        IF existing_lender_uuid IS NOT NULL THEN
            RETURN existing_lender_uuid;
        END IF;
    END IF;
    
    -- Then try to find by employee_id
    IF p_employee_id IS NOT NULL AND p_employee_id != '' THEN
        SELECT id INTO existing_lender_uuid 
        FROM lenders 
        WHERE employee_id = p_employee_id 
        LIMIT 1;
        
        IF existing_lender_uuid IS NOT NULL THEN
            RETURN existing_lender_uuid;
        END IF;
    END IF;
    
    -- If not found, create new lender
    new_lender_uuid = uuid_generate_v4();
    
    INSERT INTO lenders (
        id, lender_id, name, email, phone, department, designation, employee_id
    ) VALUES (
        new_lender_uuid, p_lender_id, p_name, p_email, p_phone, p_department, p_designation, p_employee_id
    );
    
    RETURN new_lender_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample lenders for testing
INSERT INTO lenders (name, email, phone, department, designation, employee_id, office_location, authority_level, can_approve_lending, can_lend_high_value, max_lending_value) VALUES
('Dr. John Smith', 'j.smith@college.edu', '+1-555-0101', 'Computer Science', 'Professor', 'EMP001', 'CS Building - Room 301', 'senior', true, true, 10000.00),
('Sarah Wilson', 's.wilson@college.edu', '+1-555-0102', 'Electrical Engineering', 'Lab Coordinator', 'EMP002', 'EE Lab - Room 205', 'standard', true, false, 2000.00),
('Mike Johnson', 'm.johnson@college.edu', '+1-555-0103', 'Mechanical Engineering', 'Lab Assistant', 'EMP003', 'ME Workshop - Room 110', 'standard', true, false, 1500.00),
('Dr. Emily Brown', 'e.brown@college.edu', '+1-555-0104', 'Physics', 'Department Head', 'EMP004', 'Physics Building - Room 405', 'admin', true, true, 15000.00),
('Alex Rodriguez', 'a.rodriguez@college.edu', '+1-555-0105', 'Chemistry', 'Lab Technician', 'EMP005', 'Chemistry Lab - Room 201', 'standard', true, false, 800.00);

-- Add constraint to ensure order has either student_id or lender_id
ALTER TABLE orders ADD CONSTRAINT orders_must_have_borrower 
    CHECK (student_id IS NOT NULL OR lender_id IS NOT NULL);

-- Add constraint to ensure invoice has either student_id or lender_id  
ALTER TABLE invoices ADD CONSTRAINT invoices_must_have_borrower 
    CHECK (student_id IS NOT NULL OR lender_id IS NOT NULL);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '✅ LENDER SYSTEM MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CHANGES MADE:';
    RAISE NOTICE '   • Created lenders table with staff-specific fields';
    RAISE NOTICE '   • Added lender_id and approved_by_lender to orders table';
    RAISE NOTICE '   • Added lender_id and issued_by_lender to invoices table';
    RAISE NOTICE '   • Updated invoice_details view to include lender information';
    RAISE NOTICE '   • Created generate_lender_id() and find_or_create_lender() functions';
    RAISE NOTICE '   • Added appropriate indexes and constraints';
    RAISE NOTICE '   • Inserted 5 sample lenders for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 NEXT STEPS:';
    RAISE NOTICE '   • Update backend APIs to handle lenders';
    RAISE NOTICE '   • Create Lender Management UI components';
    RAISE NOTICE '   • Update Lending Management to support lender field';
    RAISE NOTICE '   • Update Invoice Management to include lender information';
    RAISE NOTICE '';
    RAISE NOTICE '📝 SAMPLE LENDERS CREATED:';
    RAISE NOTICE '   • Dr. John Smith (CS Professor) - High authority';
    RAISE NOTICE '   • Sarah Wilson (EE Lab Coordinator) - Standard authority';
    RAISE NOTICE '   • Mike Johnson (ME Lab Assistant) - Standard authority';
    RAISE NOTICE '   • Dr. Emily Brown (Physics Head) - Admin authority';
    RAISE NOTICE '   • Alex Rodriguez (Chemistry Technician) - Standard authority';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 LENDER SYSTEM READY FOR IMPLEMENTATION!';
    RAISE NOTICE '================================================================================';
END $$;