-- Ultra-simple products insert that will definitely work
-- Run this in pgAdmin Query Tool

-- First ensure categories exist
INSERT INTO categories (id, name, description) 
VALUES 
    (gen_random_uuid(), 'Components', 'Electronic components and parts'),
    (gen_random_uuid(), 'Cables & Connectors', 'Various cables and connection components'),
    (gen_random_uuid(), 'Sensors', 'Temperature, pressure, and other sensors'),
    (gen_random_uuid(), 'Microcontrollers', 'Arduino, Raspberry Pi, and other controllers'),
    (gen_random_uuid(), 'Tools', 'Measurement and testing equipment')
ON CONFLICT (name) DO NOTHING;

-- Add simple products without specifications field to avoid JSON errors
-- Using UPSERT to handle existing SKUs
INSERT INTO products (id, name, description, category_id, sku, quantity_total, quantity_available, is_returnable, unit_price, location, minimum_stock_level, status) 
VALUES 
    (gen_random_uuid(), 'Arduino Uno R3', 'Microcontroller board based on ATmega328P', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'ARD-UNO-R3-NEW', 25, 20, true, 24.99, 'Storage-B2', 5, 'active'),
    
    (gen_random_uuid(), 'Resistor Pack (100pcs)', 'Assorted carbon film resistors 1/4W', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'RES-PACK-100-NEW', 50, 45, true, 15.99, 'Storage-A1', 10, 'active'),
    
    (gen_random_uuid(), 'Jumper Wire Set', 'Male-to-male, male-to-female, female-to-female wires', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'WIRE-JUMP-SET-NEW', 100, 85, true, 8.99, 'Storage-A2', 20, 'active'),
    
    (gen_random_uuid(), 'Half-Size Breadboard', 'Solderless breadboard for prototyping', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'BB-HALF-830-NEW', 40, 35, true, 6.99, 'Storage-A3', 15, 'active'),
    
    (gen_random_uuid(), 'LED Assortment Pack', 'Mixed color 5mm LEDs (50 pieces)', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'LED-ASST-50-NEW', 60, 50, true, 12.99, 'Storage-A4', 12, 'active'),
    
    (gen_random_uuid(), 'DS18B20 Temperature Sensor', 'Digital temperature sensor with 1-wire interface', (SELECT id FROM categories WHERE name = 'Sensors' LIMIT 1), 'TEMP-DS18B20-NEW', 30, 25, true, 9.99, 'Storage-C1', 8, 'active'),
    
    (gen_random_uuid(), 'HC-SR04 Ultrasonic Sensor', 'Distance measurement sensor module', (SELECT id FROM categories WHERE name = 'Sensors' LIMIT 1), 'DIST-HCSR04-NEW', 35, 30, true, 4.99, 'Storage-C2', 10, 'active'),
    
    (gen_random_uuid(), 'USB A to B Cable', 'Standard printer cable 2 meters', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'USB-AB-2M-NEW', 45, 40, true, 7.99, 'Storage-D1', 15, 'active'),
    
    (gen_random_uuid(), '9V Power Adapter', 'AC to DC power supply 1A output', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'PWR-9V-1A-NEW', 20, 18, true, 14.99, 'Storage-D2', 5, 'active'),
    
    (gen_random_uuid(), 'Digital Multimeter', 'Basic digital multimeter for electronics', (SELECT id FROM categories WHERE name = 'Tools' LIMIT 1), 'DMM-BASIC-NEW', 15, 12, true, 29.99, 'Tool-Room', 3, 'active'),
    
    (gen_random_uuid(), 'Soldering Iron Kit', 'Temperature controlled soldering station', (SELECT id FROM categories WHERE name = 'Tools' LIMIT 1), 'SOLDER-KIT-NEW', 12, 10, true, 45.99, 'Tool-Room', 2, 'active'),
    
    (gen_random_uuid(), 'SG90 Servo Motor', 'Micro servo for robotics projects', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'SERVO-SG90-NEW', 40, 35, true, 8.99, 'Storage-B3', 10, 'active'),
    
    (gen_random_uuid(), '16x2 LCD Display', 'Character LCD with I2C backpack', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'LCD-16X2-I2C-NEW', 25, 22, true, 16.99, 'Storage-B4', 8, 'active');

-- Verify the products were added
SELECT 
    p.name,
    p.sku,
    p.quantity_available,
    p.unit_price,
    c.name as category_name,
    p.status
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.status = 'active'
ORDER BY c.name, p.name;
