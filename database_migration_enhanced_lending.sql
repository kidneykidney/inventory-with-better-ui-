-- Enhanced Lending Management Database Migration
-- This migration adds comprehensive fields for detailed lending tracking

-- Start transaction
BEGIN;

-- Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lending_purpose TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lending_location VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supervisor_email VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lending_terms TEXT;

-- Enhanced borrower verification
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS borrower_phone VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS borrower_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Enhanced timing information
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS requested_start_date TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS actual_lending_date TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;

-- Enhanced financial information
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_return_fee DECIMAL(10,2) DEFAULT 0.00;

-- Enhanced authority information
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issuer_designation VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;

-- Enhanced acknowledgment
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS acknowledgment_method VARCHAR(50);

-- Additional information
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS risk_assessment VARCHAR(50);

-- Enhanced invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_category VARCHAR(100);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS model_number VARCHAR(100);

-- Quantity and availability
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS available_quantity INTEGER;

-- Enhanced financial details
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS replacement_cost DECIMAL(10,2) DEFAULT 0.00;

-- Enhanced lending terms for items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS max_lending_duration INTEGER;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS special_handling_required BOOLEAN DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS handling_instructions TEXT;

-- Enhanced timeline tracking
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP;

-- Enhanced condition tracking
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS condition_at_lending VARCHAR(100) DEFAULT 'good';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS condition_notes TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS pre_lending_photos TEXT[];
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS post_return_photos TEXT[];

-- Enhanced damage and replacement tracking
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS damage_severity VARCHAR(50);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS repair_required BOOLEAN DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10,2) DEFAULT 0.00;

-- Risk and safety
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'low';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS safety_requirements TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS training_required BOOLEAN DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS certification_required BOOLEAN DEFAULT false;

-- Usage tracking
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS usage_purpose VARCHAR(200);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS usage_location VARCHAR(200);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS co_users TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_lending_purpose ON invoices(lending_purpose);
CREATE INDEX IF NOT EXISTS idx_invoices_project_name ON invoices(project_name);
CREATE INDEX IF NOT EXISTS idx_invoices_supervisor_name ON invoices(supervisor_name);
CREATE INDEX IF NOT EXISTS idx_invoices_risk_assessment ON invoices(risk_assessment);
CREATE INDEX IF NOT EXISTS idx_invoices_expected_return_date ON invoices(expected_return_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_serial_number ON invoice_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_manufacturer ON invoice_items(manufacturer);
CREATE INDEX IF NOT EXISTS idx_invoice_items_risk_level ON invoice_items(risk_level);
CREATE INDEX IF NOT EXISTS idx_invoice_items_condition_at_lending ON invoice_items(condition_at_lending);

-- Create a view for comprehensive lending information
CREATE OR REPLACE VIEW lending_invoice_details AS
SELECT 
    i.id,
    i.invoice_number,
    i.order_id,
    i.student_id,
    i.status,
    
    -- Borrower information
    COALESCE(i.student_name_override, s.name) as borrower_name,
    COALESCE(i.student_email_override, s.email) as borrower_email,
    COALESCE(i.student_department_override, s.department) as borrower_department,
    s.year_of_study,
    i.borrower_phone,
    i.borrower_address,
    i.emergency_contact_name,
    i.emergency_contact_phone,
    
    -- Lending context
    i.lending_purpose,
    i.lending_location,
    i.project_name,
    i.supervisor_name,
    i.supervisor_email,
    i.lending_terms,
    i.risk_assessment,
    
    -- Timeline
    i.issue_date,
    i.requested_start_date,
    i.actual_lending_date,
    i.expected_return_date,
    i.due_date,
    i.grace_period_days,
    
    -- Financial
    i.total_items,
    i.total_value,
    i.security_deposit,
    i.lending_fee,
    i.damage_fee,
    i.replacement_fee,
    i.late_return_fee,
    
    -- Authority
    i.issued_by,
    i.issuer_designation,
    i.approved_by,
    i.approval_date,
    
    -- Status
    i.acknowledged_by_student,
    i.acknowledgment_date,
    i.acknowledgment_method,
    i.special_instructions,
    
    -- System
    i.created_at,
    i.updated_at
    
FROM invoices i
LEFT JOIN students s ON i.student_id = s.id;

-- Commit transaction
COMMIT;

-- Log migration completion
INSERT INTO database_migrations (migration_name, executed_at, description) 
VALUES (
    'enhanced_lending_management_v1', 
    CURRENT_TIMESTAMP, 
    'Added comprehensive lending tracking fields to invoices and invoice_items tables'
);
