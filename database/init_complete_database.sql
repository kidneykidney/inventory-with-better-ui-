-- Complete Database Initialization Script
-- This script creates the entire inventory management database from scratch
-- Run this to set up the database on any PostgreSQL instance

-- Create database if it doesn't exist (run this separately if needed)
-- CREATE DATABASE inventory_management;

-- Connect to the database
-- \c inventory_management;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS student_acknowledgments CASCADE;
DROP TABLE IF EXISTS invoice_transactions CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoice_images CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Drop existing sequences if they exist
DROP SEQUENCE IF EXISTS audit_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS user_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS system_settings_id_seq CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS create_lending_invoice() CASCADE;
DROP FUNCTION IF EXISTS update_product_quantity() CASCADE;
DROP FUNCTION IF EXISTS find_or_create_student(character varying, character varying, character varying, character varying, character varying, integer, character varying) CASCADE;

-- Drop existing views if they exist
DROP VIEW IF EXISTS invoice_details CASCADE;
DROP VIEW IF EXISTS students_clean CASCADE;
DROP VIEW IF EXISTS students_unique CASCADE;

-- Create utility functions first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id),
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    max_stock_level INTEGER DEFAULT 100,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    lending_price DECIMAL(10,2) DEFAULT 0.00,
    replacement_cost DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    location VARCHAR(100),
    supplier VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    department VARCHAR(100) DEFAULT 'Unknown',
    year_of_study INTEGER,
    course VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id),
    order_type VARCHAR(20) DEFAULT 'lending',
    status VARCHAR(20) DEFAULT 'pending',
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP,
    due_date TIMESTAMP,
    returned_date TIMESTAMP,
    approved_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    returned_quantity INTEGER DEFAULT 0,
    condition_on_return VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    student_id UUID REFERENCES students(id),
    invoice_type VARCHAR(50) DEFAULT 'lending',
    status VARCHAR(50) DEFAULT 'draft',
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    acknowledgment_date TIMESTAMP,
    has_physical_copy BOOLEAN DEFAULT FALSE,
    physical_invoice_captured BOOLEAN DEFAULT FALSE,
    physical_invoice_image_url TEXT,
    physical_invoice_notes TEXT,
    issued_by VARCHAR(200),
    acknowledged_by_student BOOLEAN DEFAULT FALSE,
    student_signature_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_name_override VARCHAR(200),
    student_email_override VARCHAR(200),
    student_department_override VARCHAR(200),
    use_student_override BOOLEAN DEFAULT FALSE
);

-- Invoice items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    order_item_id UUID REFERENCES order_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice images table
CREATE TABLE invoice_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'physical_invoice',
    description TEXT,
    uploaded_by VARCHAR(100),
    file_size INTEGER,
    file_format VARCHAR(20),
    ocr_text TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice transactions table
CREATE TABLE invoice_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    processed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student acknowledgments table
CREATE TABLE student_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    invoice_id UUID REFERENCES invoices(id),
    acknowledgment_type VARCHAR(50) DEFAULT 'electronic',
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product transactions table
CREATE TABLE product_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER,
    quantity_after INTEGER,
    reference_type VARCHAR(50),
    reference_id UUID,
    reason TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    recipient_type VARCHAR(50) DEFAULT 'admin',
    recipient_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE SEQUENCE system_settings_id_seq;
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT nextval('system_settings_id_seq'),
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- Users table
CREATE SEQUENCE users_id_seq;
CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE SEQUENCE user_sessions_id_seq;
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY DEFAULT nextval('user_sessions_id_seq'),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    access_token_jti VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_jti VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45)
);

-- Audit logs table
CREATE SEQUENCE audit_logs_id_seq;
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY DEFAULT nextval('audit_logs_id_seq'),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_id_flexible ON students(student_id) WHERE student_id IS NOT NULL AND student_id != '';
CREATE INDEX idx_students_email_flexible ON students(email) WHERE email IS NOT NULL AND email != '';
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_invoice_images_invoice_id ON invoice_images(invoice_id);
CREATE INDEX idx_invoice_images_image_type ON invoice_images(image_type);
CREATE INDEX idx_invoice_transactions_invoice_id ON invoice_transactions(invoice_id);
CREATE INDEX idx_student_acknowledgments_invoice_id ON student_acknowledgments(invoice_id);
CREATE INDEX idx_product_transactions_product_id ON product_transactions(product_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_key ON system_settings(key);

-- Create unique partial indexes for students
CREATE UNIQUE INDEX students_student_id_unique_when_not_empty ON students(student_id) WHERE student_id IS NOT NULL AND student_id != '';
CREATE UNIQUE INDEX students_email_unique_when_not_empty ON students(email) WHERE email IS NOT NULL AND email != '';

-- Add triggers for updated_at columns
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic functions
CREATE OR REPLACE FUNCTION generate_student_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        NEW.student_id := 'STU' || LPAD(nextval('students_temp_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create temporary sequence for student IDs
CREATE SEQUENCE IF NOT EXISTS students_temp_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
BEGIN
    -- Determine prefix based on invoice type
    CASE NEW.invoice_type
        WHEN 'lending' THEN prefix := 'LND';
        WHEN 'sale' THEN prefix := 'SAL';
        WHEN 'return' THEN prefix := 'RET';
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_lending_invoice() RETURNS TRIGGER AS $$
BEGIN
    -- Only create invoice for approved lending orders
    IF NEW.status = 'approved' AND NEW.order_type = 'lending' AND OLD.status = 'pending' THEN
        INSERT INTO invoices (
            order_id,
            student_id,
            invoice_type,
            status,
            total_items,
            total_value,
            lending_fee,
            issue_date,
            due_date,
            issued_by,
            notes
        )
        SELECT 
            NEW.id,
            NEW.student_id,
            'lending',
            'issued',
            COALESCE((SELECT COUNT(*) FROM order_items WHERE order_id = NEW.id), 0),
            COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = NEW.id), 0),
            COALESCE((SELECT SUM(quantity * lending_fee) FROM order_items WHERE order_id = NEW.id), 0),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP + INTERVAL '30 days',
            NEW.approved_by,
            'Auto-generated lending invoice for approved order';
        
        -- Create invoice transaction record
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            amount,
            transaction_date,
            status,
            notes
        )
        SELECT 
            i.id,
            'lending_fee',
            i.lending_fee,
            CURRENT_TIMESTAMP,
            'pending',
            'Auto-generated lending invoice for approved order'
        FROM invoices i
        WHERE i.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_quantity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease product quantity when order item is added
        UPDATE products 
        SET quantity = quantity - NEW.quantity 
        WHERE id = NEW.product_id;
        
        -- Record transaction
        INSERT INTO product_transactions (
            product_id, transaction_type, quantity_change, 
            reference_type, reference_id, reason
        ) VALUES (
            NEW.product_id, 'outgoing', -NEW.quantity,
            'order_item', NEW.id, 'Item ordered'
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust quantity if order item quantity changed
        IF OLD.quantity != NEW.quantity THEN
            UPDATE products 
            SET quantity = quantity + OLD.quantity - NEW.quantity 
            WHERE id = NEW.product_id;
            
            INSERT INTO product_transactions (
                product_id, transaction_type, quantity_change,
                reference_type, reference_id, reason
            ) VALUES (
                NEW.product_id, 'adjustment', OLD.quantity - NEW.quantity,
                'order_item', NEW.id, 'Order quantity updated'
            );
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Restore quantity when order item is deleted
        UPDATE products 
        SET quantity = quantity + OLD.quantity 
        WHERE id = OLD.product_id;
        
        INSERT INTO product_transactions (
            product_id, transaction_type, quantity_change,
            reference_type, reference_id, reason
        ) VALUES (
            OLD.product_id, 'incoming', OLD.quantity,
            'order_item', OLD.id, 'Order item cancelled'
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_or_create_student(
    p_student_id VARCHAR(50),
    p_name VARCHAR(200),
    p_email VARCHAR(200),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_department VARCHAR(100) DEFAULT 'Unknown',
    p_year_of_study INTEGER DEFAULT NULL,
    p_course VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    student_uuid UUID;
BEGIN
    -- Try to find existing student by student_id or email
    SELECT id INTO student_uuid
    FROM students 
    WHERE (student_id = p_student_id AND p_student_id IS NOT NULL AND p_student_id != '')
       OR (email = p_email AND p_email IS NOT NULL AND p_email != '');
    
    -- If student not found, create new one
    IF student_uuid IS NULL THEN
        student_uuid := uuid_generate_v4();
        
        INSERT INTO students (
            id, student_id, name, email, phone, 
            department, year_of_study, course
        ) VALUES (
            student_uuid, p_student_id, p_name, p_email, p_phone,
            p_department, p_year_of_study, p_course
        );
    END IF;
    
    RETURN student_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER generate_student_id_trigger BEFORE INSERT ON students FOR EACH ROW EXECUTE FUNCTION generate_student_id();
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
CREATE TRIGGER create_lending_invoice_trigger AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION create_lending_invoice();
CREATE TRIGGER update_product_quantity_trigger AFTER INSERT OR UPDATE OR DELETE ON order_items FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- Create views for better data access
CREATE VIEW invoice_details AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_type,
    i.status,
    i.total_items,
    i.total_value,
    i.lending_fee,
    i.damage_fee,
    i.replacement_fee,
    i.issue_date,
    i.due_date,
    i.acknowledgment_date,
    i.physical_invoice_captured,
    i.physical_invoice_image_url,
    i.issued_by,
    i.acknowledged_by_student,
    i.notes,
    i.created_at,
    i.updated_at,
    s.name as student_name,
    s.student_id,
    s.email as student_email,
    s.department as student_department,
    o.order_number,
    o.order_type,
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as item_count,
    (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) as image_count,
    (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as acknowledgment_count,
    (SELECT MAX(acknowledged_at) FROM student_acknowledgments sa 
     WHERE sa.invoice_id = i.id AND acknowledgment_type = 'electronic') as last_electronic_acknowledgment,
    CASE 
        WHEN i.use_student_override THEN i.student_name_override 
        ELSE s.name 
    END as display_student_name
FROM invoices i
LEFT JOIN students s ON i.student_id = s.id
LEFT JOIN orders o ON i.order_id = o.id;

CREATE VIEW students_clean AS
SELECT DISTINCT
    id, student_id, name, email, phone, department, 
    year_of_study, course, status, created_at, updated_at
FROM students
WHERE status = 'active'
    AND name IS NOT NULL 
    AND name != '';

CREATE VIEW students_unique AS
SELECT DISTINCT ON (
    COALESCE(NULLIF(student_id, ''), NULLIF(email, ''), name)
)
    id, student_id, name, email, phone, department,
    year_of_study, course, status, created_at, updated_at
FROM students
WHERE status = 'active'
ORDER BY COALESCE(NULLIF(student_id, ''), NULLIF(email, ''), name), created_at DESC;

-- Insert default system settings
INSERT INTO system_settings (category, key, value, description, is_public) VALUES
('general', 'app_name', 'Inventory Management System', 'Application name', true),
('general', 'app_version', '1.0.0', 'Application version', true),
('general', 'max_lending_days', '30', 'Maximum lending period in days', false),
('general', 'default_lending_fee', '5.00', 'Default lending fee per item', false),
('inventory', 'low_stock_threshold', '5', 'Low stock alert threshold', false),
('invoice', 'auto_generate_invoices', 'true', 'Auto-generate invoices for approved orders', false),
('invoice', 'require_physical_signature', 'false', 'Require physical signature for invoices', false),
('notifications', 'email_enabled', 'false', 'Enable email notifications', false),
('notifications', 'low_stock_alerts', 'true', 'Enable low stock alerts', false);

-- Insert default admin user
INSERT INTO users (username, email, password, full_name, role, status) VALUES
('admin', 'admin@college.edu', 'College@2025', 'System Administrator', 'main_admin', 'active');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Laboratory Equipment', 'Scientific and research equipment'),
('Tools', 'Hand tools and machinery'),
('Computers', 'Computers and IT equipment'),
('Furniture', 'Office and laboratory furniture');

-- Create success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialization completed successfully!';
    RAISE NOTICE '📊 Created tables: categories, products, students, orders, order_items, invoices, invoice_items, invoice_images, invoice_transactions, student_acknowledgments, product_transactions, notifications, system_settings, users, user_sessions, audit_logs';
    RAISE NOTICE '⚡ Created functions: update_updated_at_column, generate_student_id, generate_invoice_number, create_lending_invoice, update_product_quantity, find_or_create_student';
    RAISE NOTICE '🔍 Created views: invoice_details, students_clean, students_unique';
    RAISE NOTICE '🚀 Default admin user: admin / College@2025';
    RAISE NOTICE '📝 Ready to use! Run your application now.';
END $$;
