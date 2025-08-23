-- Unified Inventory Management Database Schema
-- This schema supports both Products and Orders with lending/borrowing functionality

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

-- 4. ORDERS Table (main order/lending records)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- ORD001, ORD002, etc.
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
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

-- 5. ORDER_ITEMS Table (items in each order)
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

-- 6. PRODUCT_TRANSACTIONS Table (track all stock movements)
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

-- 7. NOTIFICATIONS Table (for alerts and reminders)
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
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_product_transactions_product_id ON product_transactions(product_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

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
