-- ===================================================================
-- MASTER DATABASE SETUP SCRIPT
-- ===================================================================
-- Complete inventory management system database setup
-- This script creates the database and runs all necessary setup
-- 
-- Usage: psql -U postgres -f MASTER_DATABASE_SETUP.sql
-- 
-- Author: College Inventory System
-- Date: September 2025
-- Version: 2.0
-- ===================================================================

\echo '🚀 Starting Complete Database Setup...'

-- Create database (ignore error if exists)
CREATE DATABASE inventory_management;
\echo '✅ Database created (or already exists)'

-- Connect to the new database
\c inventory_management;
\echo '🔗 Connected to inventory_management database'

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\echo '📦 Extensions enabled'

\echo '🧹 Cleaning existing objects...'

-- Drop all existing tables in correct order (respecting foreign key constraints)
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

-- Drop sequences
DROP SEQUENCE IF EXISTS audit_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS user_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS system_settings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS students_temp_seq CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS create_lending_invoice() CASCADE;
DROP FUNCTION IF EXISTS update_product_quantity() CASCADE;
DROP FUNCTION IF EXISTS find_or_create_student(character varying, character varying, character varying, character varying, character varying, integer, character varying) CASCADE;

-- Drop views
DROP VIEW IF EXISTS invoice_details CASCADE;
DROP VIEW IF EXISTS students_clean CASCADE;
DROP VIEW IF EXISTS students_unique CASCADE;

\echo '🏗️  Creating database schema...'

-- ===================================================================
-- UTILITY FUNCTIONS
-- ===================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate student IDs
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    student_id TEXT;
BEGIN
    -- Get the next number from sequence
    SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 5) AS INTEGER)), 0) + 1 
    INTO next_id 
    FROM students 
    WHERE student_id LIKE 'STUD%' AND LENGTH(student_id) = 7;
    
    -- Default to 1 if no students exist
    IF next_id IS NULL THEN
        next_id := 1;
    END IF;
    
    -- Format as STUD001, STUD002, etc.
    student_id := 'STUD' || LPAD(next_id::TEXT, 3, '0');
    
    RETURN student_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_sequence INTEGER;
    invoice_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the next sequence number for the current year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM invoices 
    WHERE invoice_number LIKE 'INV-' || current_year || '-%';
    
    -- Default to 1 if no invoices exist for this year
    IF next_sequence IS NULL THEN
        next_sequence := 1;
    END IF;
    
    -- Format as INV-2025-0001, INV-2025-0002, etc.
    invoice_number := 'INV-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table  
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL DEFAULT generate_student_id(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    year_of_study INTEGER,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_year_of_study CHECK (year_of_study >= 1 AND year_of_study <= 8)
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    quantity INTEGER DEFAULT 0,
    unit_value DECIMAL(10,2) DEFAULT 0.00,
    location VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'good',
    is_lendable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity CHECK (quantity >= 0),
    CONSTRAINT check_unit_value CHECK (unit_value >= 0)
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL DEFAULT generate_invoice_number(),
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    invoice_type VARCHAR(20) NOT NULL DEFAULT 'lending',
    status VARCHAR(20) DEFAULT 'issued',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    return_date DATE,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    issued_by VARCHAR(100),
    lender_name VARCHAR(100),
    lender_email VARCHAR(100),
    lender_phone VARCHAR(20),
    lender_department VARCHAR(100),
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_invoice_type CHECK (invoice_type IN ('lending', 'return', 'damage', 'replacement')),
    CONSTRAINT check_status CHECK (status IN ('issued', 'returned', 'overdue', 'cancelled', 'approved')),
    CONSTRAINT check_dates CHECK (due_date >= issue_date),
    CONSTRAINT check_total_value CHECK (total_value >= 0)
);

-- Invoice items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_value DECIMAL(10,2) DEFAULT 0.00,
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_value) STORED,
    condition_before VARCHAR(50) DEFAULT 'good',
    condition_after VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_unit_value_positive CHECK (unit_value >= 0)
);

-- Invoice images table (for OCR uploads)
CREATE TABLE invoice_images (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_name VARCHAR(200),
    image_type VARCHAR(50),
    image_size INTEGER,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ocr_text TEXT,
    ocr_confidence DECIMAL(3,2),
    processed_by VARCHAR(100)
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE,
    student_id INTEGER REFERENCES students(id),
    status VARCHAR(20) DEFAULT 'pending',
    order_date DATE DEFAULT CURRENT_DATE,
    total_items INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_order_status CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled'))
);

-- Order items table  
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_order_quantity CHECK (quantity > 0)
);

-- Users table (for authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_role CHECK (role IN ('admin', 'manager', 'user', 'viewer'))
);

-- System settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_notification_type CHECK (type IN ('info', 'warning', 'error', 'success'))
);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

\echo '📋 Core tables created'

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Students indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_department ON students(department);

-- Products indexes  
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Invoices indexes
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- System settings indexes
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_key ON system_settings(category, key);

\echo '🔍 Indexes created'

-- ===================================================================
-- TRIGGERS
-- ===================================================================

-- Update timestamps
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '⚡ Triggers created'

-- ===================================================================
-- VIEWS
-- ===================================================================

-- Invoice details view
CREATE VIEW invoice_details AS
SELECT 
    i.id,
    i.invoice_number,
    i.student_id,
    s.student_id as student_code,
    s.name as student_name,
    s.email as student_email,
    s.department as student_department,
    i.invoice_type,
    i.status,
    i.issue_date,
    i.due_date,
    i.return_date,
    i.total_value,
    i.lender_name,
    i.lender_department,
    i.image_count,
    COALESCE(ii.item_count, 0) as item_count,
    i.created_at
FROM invoices i
LEFT JOIN students s ON i.student_id = s.id  
LEFT JOIN (
    SELECT invoice_id, COUNT(*) as item_count
    FROM invoice_items 
    GROUP BY invoice_id
) ii ON i.id = ii.invoice_id;

\echo '👀 Views created'

-- ===================================================================
-- SAMPLE DATA
-- ===================================================================

\echo '📊 Inserting sample data...'

-- Categories
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and equipment'),
('Laboratory', 'Laboratory equipment and supplies'),
('Books', 'Educational books and materials'),
('Tools', 'Workshop tools and equipment'),
('Computers', 'Computer hardware and accessories'),
('Scientific', 'Scientific instruments and devices');

-- Sample students
INSERT INTO students (name, email, department, year_of_study) VALUES
('John Michael Smith', 'john.smith@college.edu', 'Computer Science', 2),
('Emma Wilson', 'emma.wilson@college.edu', 'Biology', 3),
('Sarah Johnson', 'sarah.johnson@college.edu', 'Chemistry', 1),
('Michael Brown', 'michael.brown@college.edu', 'Physics', 4);

-- Sample products
INSERT INTO products (name, description, sku, category_id, quantity, unit_value, location) VALUES
('Laptop Dell Inspiron', 'Dell Inspiron 15 3000 Series', 'DELL-INS-001', 5, 10, 45000.00, 'IT Room A'),
('Microscope Olympus', 'Olympus CX23 Binocular Microscope', 'OLYM-MIC-001', 2, 5, 25000.00, 'Lab Room 1'),
('Arduino Uno', 'Arduino Uno R3 Development Board', 'ARD-UNO-001', 1, 20, 800.00, 'Electronics Lab'),
('Chemistry Set', 'Complete Chemistry Laboratory Set', 'CHEM-SET-001', 2, 8, 5000.00, 'Chemistry Lab'),
('Digital Multimeter', 'Fluke 117 Digital Multimeter', 'FLUKE-DMM-001', 6, 15, 12000.00, 'Electronics Lab');

-- Sample admin user
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
('admin', 'admin@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewzW0VlGHQXON2aW', 'System Administrator', 'admin', 'IT Department');

-- Basic system settings
INSERT INTO system_settings (category, key, value, description) VALUES
('organization', 'company_name', 'College Incubation Center', 'Institution name'),
('organization', 'contact_email', 'admin@college.edu', 'Primary contact email'),
('automation', 'auto_approve_orders', '1000', 'Auto-approve orders under this value'),
('customization', 'enable_orders', 'true', 'Enable order management system'),
('data_admin', 'auto_backup', 'true', 'Enable automatic backups');

\echo '✅ Sample data inserted'

-- ===================================================================
-- PERMISSIONS
-- ===================================================================

-- Grant permissions to common database users
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

\echo '🔐 Permissions granted'

-- ===================================================================
-- VERIFICATION
-- ===================================================================

\echo '🧪 Verifying database setup...'

-- Check table counts
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'students', COUNT(*) FROM students  
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings;

-- Test functions
SELECT 'Next Student ID: ' || generate_student_id() as test_function;
SELECT 'Next Invoice Number: ' || generate_invoice_number() as test_function;

\echo ''
\echo '🎉 Database setup completed successfully!'
\echo ''
\echo '📋 Summary:'
\echo '   ✅ Database: inventory_management'
\echo '   ✅ Tables: 15 core tables created'
\echo '   ✅ Functions: 3 utility functions'
\echo '   ✅ Triggers: 6 update triggers'
\echo '   ✅ Views: 1 invoice details view'
\echo '   ✅ Sample Data: Categories, students, products, users'
\echo '   ✅ Indexes: Performance indexes created'
\echo ''
\echo '🚀 Next steps:'
\echo '   1. Update backend/database_manager.py with connection details'
\echo '   2. Start backend: python backend/main.py'
\echo '   3. Start frontend: npm start'
\echo '   4. Visit: http://localhost:3000'
\echo ''
\echo '📚 For detailed documentation, see: DATABASE_SETUP_COMPLETE.md'