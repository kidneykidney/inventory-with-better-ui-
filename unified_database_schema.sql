-- ===================================================================
-- UNIFIED INVENTORY MANAGEMENT DATABASE SCHEMA
-- ===================================================================
-- Complete database schema consolidating all scattered SQL files
-- This single file replaces all other database files and provides
-- a complete, consistent, and optimized database structure
-- ===================================================================

-- Database setup and extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all existing tables and dependencies (clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
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

-- Drop all sequences
DROP SEQUENCE IF EXISTS audit_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS user_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS system_settings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS students_temp_seq CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS create_lending_invoice() CASCADE;
DROP FUNCTION IF EXISTS update_product_quantity() CASCADE;
DROP FUNCTION IF EXISTS find_or_create_student(character varying, character varying, character varying, character varying, character varying, integer, character varying) CASCADE;

-- Drop all views
DROP VIEW IF EXISTS invoice_details CASCADE;
DROP VIEW IF EXISTS students_clean CASCADE;
DROP VIEW IF EXISTS students_unique CASCADE;

-- ===================================================================
-- CORE UTILITY FUNCTIONS
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_student_id() 
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_id VARCHAR(50);
BEGIN
    -- Only generate if student_id is null or empty
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        -- Get the next student number
        SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 'STUD([0-9]+)') AS INTEGER)), 0) + 1 
        INTO next_number 
        FROM students 
        WHERE student_id ~ '^STUD[0-9]+$';
        
        -- Generate the student ID
        NEW.student_id = 'STUD' || LPAD(next_number::TEXT, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
        WHEN 'sale' THEN prefix := 'SAL';
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

CREATE OR REPLACE FUNCTION update_product_quantity() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET quantity_available = quantity_available - NEW.quantity_approved
        WHERE id = NEW.product_id;
        
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
    
    IF TG_OP = 'UPDATE' THEN
        IF OLD.quantity_approved != NEW.quantity_approved THEN
            UPDATE products 
            SET quantity_available = quantity_available + OLD.quantity_approved - NEW.quantity_approved
            WHERE id = NEW.product_id;
        END IF;
        
        IF OLD.quantity_returned != NEW.quantity_returned THEN
            UPDATE products 
            SET quantity_available = quantity_available + (NEW.quantity_returned - OLD.quantity_returned)
            WHERE id = NEW.product_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET quantity_available = quantity_available + OLD.quantity_approved - OLD.quantity_returned
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_or_create_student(
    p_student_id character varying,
    p_name character varying,
    p_email character varying,
    p_phone character varying DEFAULT NULL,
    p_department character varying DEFAULT 'Unknown',
    p_year_of_study integer DEFAULT NULL,
    p_course character varying DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    existing_student_uuid UUID;
    new_student_uuid UUID;
BEGIN
    -- First try to find by student_id
    IF p_student_id IS NOT NULL AND p_student_id != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE student_id = p_student_id 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- Then try to find by email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE email = p_email 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- If not found, create new student
    new_student_uuid = uuid_generate_v4();
    
    INSERT INTO students (
        id, student_id, name, email, phone, department, year_of_study, course
    ) VALUES (
        new_student_uuid, p_student_id, p_name, p_email, p_phone, p_department, p_year_of_study, p_course
    );
    
    RETURN new_student_uuid;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- AUTHENTICATION AND USER MANAGEMENT TABLES
-- ===================================================================

CREATE SEQUENCE users_id_seq;
CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE user_sessions_id_seq;
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY DEFAULT nextval('user_sessions_id_seq'),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token_jti VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE audit_logs_id_seq;
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY DEFAULT nextval('audit_logs_id_seq'),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE system_settings_id_seq;
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT nextval('system_settings_id_seq'),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string' NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- ===================================================================
-- CORE INVENTORY MANAGEMENT TABLES
-- ===================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    quantity_available INTEGER DEFAULT 0 NOT NULL,
    quantity_total INTEGER DEFAULT 0 NOT NULL,
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER DEFAULT 1000,
    is_returnable BOOLEAN DEFAULT true NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_cost DECIMAL(10,2) DEFAULT 0.00,
    location VARCHAR(100),
    supplier VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    image_url TEXT,
    specifications JSONB,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    department VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    year_of_study INTEGER,
    course VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(200),
    emergency_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    order_type VARCHAR(50) DEFAULT 'lending',
    status VARCHAR(50) DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP,
    completed_date TIMESTAMP,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    approved_by VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL,
    quantity_approved INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    is_returnable BOOLEAN NOT NULL,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    return_condition VARCHAR(100),
    condition_notes TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- INVOICE MANAGEMENT TABLES
-- ===================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    invoice_type VARCHAR(50) DEFAULT 'lending',
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Enhanced lending information
    lending_purpose TEXT, -- Why is this equipment being lent?
    lending_location VARCHAR(200), -- Where will the equipment be used?
    project_name VARCHAR(200), -- What project/assignment is this for?
    supervisor_name VARCHAR(200), -- Who is supervising the project?
    supervisor_email VARCHAR(200), -- Supervisor contact
    lending_terms TEXT, -- Specific terms and conditions
    
    -- Enhanced borrower verification
    borrower_phone VARCHAR(20), -- Phone number for contact
    borrower_address TEXT, -- Physical address
    emergency_contact_name VARCHAR(200), -- Emergency contact
    emergency_contact_phone VARCHAR(20), -- Emergency contact phone
    
    -- Enhanced timing information  
    requested_start_date TIMESTAMP, -- When borrower wants to start using
    actual_lending_date TIMESTAMP, -- When actually lent out
    expected_return_date TIMESTAMP, -- Expected return date
    grace_period_days INTEGER DEFAULT 7, -- Grace period for returns
    
    -- Financial information
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    security_deposit DECIMAL(10,2) DEFAULT 0.00, -- Security deposit amount
    lending_fee DECIMAL(10,2) DEFAULT 0.00,
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    late_return_fee DECIMAL(10,2) DEFAULT 0.00, -- Fee for late returns
    
    -- Dates and timeline
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    acknowledgment_date TIMESTAMP,
    
    -- Physical documentation  
    has_physical_copy BOOLEAN DEFAULT false,
    physical_invoice_captured BOOLEAN DEFAULT false,
    physical_invoice_image_url TEXT,
    physical_invoice_notes TEXT,
    
    -- Authority and approval
    issued_by VARCHAR(200), -- Who is lending the equipment
    issuer_designation VARCHAR(100), -- Lender's role/position
    approved_by VARCHAR(200), -- Who approved the lending
    approval_date TIMESTAMP, -- When it was approved
    
    -- Student acknowledgment
    acknowledged_by_student BOOLEAN DEFAULT false,
    student_signature_url TEXT,
    acknowledgment_method VARCHAR(50), -- How they acknowledged (digital, physical, etc.)
    
    -- Additional information
    notes TEXT,
    special_instructions TEXT, -- Special handling instructions
    risk_assessment VARCHAR(50), -- Low, Medium, High risk
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Override fields for manual creation
    student_name_override VARCHAR(200),
    student_email_override VARCHAR(200),
    student_department_override VARCHAR(200),
    use_student_override BOOLEAN DEFAULT false
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    
    -- Enhanced component information
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_category VARCHAR(100), -- Component category (e.g., Electronics, Mechanical)
    product_description TEXT, -- Detailed description
    serial_number VARCHAR(100), -- Individual serial number if applicable
    manufacturer VARCHAR(100), -- Who made this component
    model_number VARCHAR(100), -- Model/part number
    
    -- Quantity and availability
    quantity INTEGER NOT NULL,
    available_quantity INTEGER, -- How many are available in inventory
    
    -- Financial details
    unit_value DECIMAL(10,2) DEFAULT 0.00,
    total_value DECIMAL(10,2) DEFAULT 0.00,
    replacement_cost DECIMAL(10,2) DEFAULT 0.00, -- Cost to replace if lost/damaged
    
    -- Lending terms for this specific item
    lending_duration_days INTEGER,
    max_lending_duration INTEGER, -- Maximum allowed lending period
    special_handling_required BOOLEAN DEFAULT false,
    handling_instructions TEXT, -- Special instructions for this component
    
    -- Timeline tracking
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    grace_period_end_date TIMESTAMP, -- When grace period expires
    
    -- Condition tracking
    condition_at_lending VARCHAR(100) DEFAULT 'good', -- Condition when lent out
    return_condition VARCHAR(100), -- Condition when returned
    condition_notes TEXT, -- Notes about condition
    pre_lending_photos TEXT[], -- URLs to photos before lending
    post_return_photos TEXT[], -- URLs to photos after return
    
    -- Damage and replacement tracking
    damage_assessment TEXT,
    damage_severity VARCHAR(50), -- Minor, Major, Total Loss
    damage_fee DECIMAL(10,2) DEFAULT 0.00,
    replacement_needed BOOLEAN DEFAULT false,
    replacement_fee DECIMAL(10,2) DEFAULT 0.00,
    repair_required BOOLEAN DEFAULT false,
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Risk and safety
    risk_level VARCHAR(50) DEFAULT 'low', -- Low, Medium, High
    safety_requirements TEXT, -- Safety precautions needed
    training_required BOOLEAN DEFAULT false, -- Does borrower need training?
    certification_required BOOLEAN DEFAULT false, -- Does borrower need certification?
    
    -- Usage tracking
    usage_purpose VARCHAR(200), -- What will this component be used for?
    usage_location VARCHAR(200), -- Where will it be used?
    co_users TEXT[], -- Other people who might use this component
    
    -- Additional information
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    image_filename VARCHAR(255),
    image_size INTEGER,
    image_format VARCHAR(10),
    uploaded_by VARCHAR(200),
    upload_method VARCHAR(50),
    capture_timestamp TIMESTAMP,
    device_info JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    ocr_text TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by VARCHAR(200),
    changes_summary TEXT,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    acknowledgment_type VARCHAR(50) NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_method VARCHAR(50),
    signature_image_url TEXT,
    photo_evidence_url TEXT,
    digital_signature_data TEXT,
    acknowledgment_location VARCHAR(200),
    witness_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- TRANSACTION AND NOTIFICATION TABLES
-- ===================================================================

CREATE TABLE product_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER,
    quantity_after INTEGER,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by VARCHAR(200),
    performed_by VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal',
    action_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================================

-- Authentication tables indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(access_token_jti);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_key ON system_settings(category, key);

-- Core inventory indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_low_stock ON products(quantity_available) WHERE quantity_available <= minimum_stock_level;

-- Student indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_student_id_flexible ON students(student_id) WHERE student_id IS NOT NULL AND student_id != '';
CREATE INDEX idx_students_email_flexible ON students(email) WHERE email IS NOT NULL AND email != '';
CREATE UNIQUE INDEX students_student_id_unique_when_not_empty ON students(student_id) WHERE student_id IS NOT NULL AND student_id != '';
CREATE UNIQUE INDEX students_email_unique_when_not_empty ON students(email) WHERE email IS NOT NULL AND email != '';

-- Order indexes
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(requested_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Invoice indexes
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_invoice_images_invoice_id ON invoice_images(invoice_id);
CREATE INDEX idx_invoice_images_image_type ON invoice_images(image_type);
CREATE INDEX idx_invoice_transactions_invoice_id ON invoice_transactions(invoice_id);
CREATE INDEX idx_student_acknowledgments_invoice_id ON student_acknowledgments(invoice_id);
CREATE INDEX idx_student_acknowledgments_student_id ON student_acknowledgments(student_id);

-- Transaction and notification indexes
CREATE INDEX idx_product_transactions_product_id ON product_transactions(product_id);
CREATE INDEX idx_product_transactions_type ON product_transactions(transaction_type);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ===================================================================
-- TRIGGERS FOR AUTOMATED BUSINESS LOGIC
-- ===================================================================

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_student_id_trigger BEFORE INSERT ON students FOR EACH ROW EXECUTE FUNCTION generate_student_id();
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON invoices FOR EACH ROW WHEN ((new.invoice_number IS NULL) OR ((new.invoice_number)::text = ''::text)) EXECUTE FUNCTION generate_invoice_number();
CREATE TRIGGER create_lending_invoice_trigger AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION create_lending_invoice();
CREATE TRIGGER update_product_quantity_trigger AFTER INSERT OR DELETE OR UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- ===================================================================
-- VIEWS FOR COMPLEX DATA ACCESS
-- ===================================================================

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
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count,
    (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) AS image_count,
    (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) AS acknowledgment_count,
    (SELECT sa.acknowledged_at FROM student_acknowledgments sa WHERE sa.invoice_id = i.id ORDER BY sa.acknowledged_at DESC LIMIT 1) AS latest_acknowledgment,
    i.created_at,
    i.updated_at
FROM invoices i
LEFT JOIN orders o ON i.order_id = o.id
LEFT JOIN students s ON i.student_id = s.id;

CREATE VIEW students_clean AS
SELECT 
    id,
    student_id,
    name,
    email,
    phone,
    department,
    year_of_study,
    course,
    is_active,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at) AS student_id_rank,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS email_rank
FROM students
WHERE is_active = true;

CREATE VIEW students_unique AS
SELECT 
    id,
    student_id,
    name,
    email,
    phone,
    department,
    year_of_study,
    course,
    is_active,
    created_at,
    updated_at,
    student_id_rank,
    email_rank
FROM students_clean
WHERE student_id_rank = 1 AND email_rank = 1;

-- ===================================================================
-- DEFAULT DATA INSERTION
-- ===================================================================

-- Insert default admin user (password: College@2025)
INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES
('admin', 'admin@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LqZkfT5XLsRQOqWGC', 'System Administrator', 'main_admin', 'active');

-- Insert default system settings
INSERT INTO system_settings (category, key, value, description, is_public) VALUES
('general', 'app_name', 'College Inventory Management System', 'Application name', true),
('general', 'app_version', '2.0.0', 'Application version', true),
('general', 'max_lending_days', '30', 'Maximum lending period in days', false),
('general', 'default_lending_fee', '5.00', 'Default lending fee per item', false),
('inventory', 'low_stock_threshold', '5', 'Low stock alert threshold', false),
('inventory', 'auto_reorder_enabled', 'false', 'Enable automatic reordering', false),
('invoice', 'auto_generate_invoices', 'true', 'Auto-generate invoices for approved orders', false),
('invoice', 'require_physical_signature', 'false', 'Require physical signature for invoices', false),
('notifications', 'email_enabled', 'false', 'Enable email notifications', false),
('notifications', 'low_stock_alerts', 'true', 'Enable low stock alerts', false),
('security', 'session_timeout_minutes', '60', 'Session timeout in minutes', false),
('security', 'max_failed_login_attempts', '5', 'Maximum failed login attempts', false);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Laboratory Equipment', 'Scientific and research equipment'),
('Tools & Hardware', 'Hand tools and machinery'),
('Computers & IT', 'Computers and IT equipment'),
('Furniture', 'Office and laboratory furniture'),
('Books & Materials', 'Educational books and materials'),
('Safety Equipment', 'Safety gear and protective equipment');

-- ===================================================================
-- SUCCESS MESSAGE AND COMPLETION NOTICE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '✅ UNIFIED INVENTORY MANAGEMENT DATABASE SCHEMA INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CREATED:';
    RAISE NOTICE '   Authentication: users, user_sessions, audit_logs, system_settings';
    RAISE NOTICE '   Inventory: categories, products, students';
    RAISE NOTICE '   Orders: orders, order_items';
    RAISE NOTICE '   Invoices: invoices, invoice_items, invoice_images, invoice_transactions';
    RAISE NOTICE '   Tracking: student_acknowledgments, product_transactions, notifications';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ FUNCTIONS CREATED:';
    RAISE NOTICE '   update_updated_at_column, generate_student_id, generate_invoice_number';
    RAISE NOTICE '   create_lending_invoice, update_product_quantity, find_or_create_student';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VIEWS CREATED:';
    RAISE NOTICE '   invoice_details, students_clean, students_unique';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 DEFAULT CREDENTIALS:';
    RAISE NOTICE '   Username: admin';
    RAISE NOTICE '   Password: College@2025';
    RAISE NOTICE '';
    RAISE NOTICE '📝 READY TO USE! Start your application now.';
    RAISE NOTICE '================================================================================';
END $$;
