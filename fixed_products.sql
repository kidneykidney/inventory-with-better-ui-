-- Simple products insert that will work without JSON syntax errors
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

-- Add simple products without complex JSON
INSERT INTO products (id, name, description, category_id, sku, quantity_total, quantity_available, is_returnable, unit_price, location, minimum_stock_level, image_url, specifications, status) 
VALUES 
    (gen_random_uuid(), 'Arduino Uno R3', 'Microcontroller board based on ATmega328P', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'ARD-UNO-R3', 25, 20, true, 24.99, 'Storage-B2', 5, 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400', 'MCU: ATmega328P, Clock: 16MHz, I/O Pins: 14 digital, 6 analog', 'active'),
    
    (gen_random_uuid(), 'Resistor Pack (100pcs)', 'Assorted carbon film resistors 1/4W', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'RES-PACK-100', 50, 45, true, 15.99, 'Storage-A1', 10, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Resistance: 1Ω to 10MΩ, Tolerance: ±5%, Power: 1/4W', 'active'),
    
    (gen_random_uuid(), 'Jumper Wire Set', 'Male-to-male, male-to-female, female-to-female', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'WIRE-JUMP-SET', 100, 85, true, 8.99, 'Storage-A2', 20, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Length: 20cm, Colors: 10 different, Quantity: 120 pieces', 'active'),
    
    (gen_random_uuid(), 'Half-Size Breadboard', 'Solderless breadboard for prototyping', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'BB-HALF-830', 40, 35, true, 6.99, 'Storage-A3', 15, 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=400', 'Tie Points: 830, Size: 83x55mm, Colors: White', 'active'),
    
    (gen_random_uuid(), 'LED Assortment Pack', 'Mixed color 5mm LEDs (50 pieces)', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'LED-ASST-50', 60, 50, true, 12.99, 'Storage-A4', 12, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Colors: Red, Blue, Green, Yellow, White, Forward Voltage: 1.8-3.2V', 'active'),
    
    (gen_random_uuid(), 'DS18B20 Temperature Sensor', 'Digital temperature sensor with 1-wire interface', (SELECT id FROM categories WHERE name = 'Sensors' LIMIT 1), 'TEMP-DS18B20', 30, 25, true, 9.99, 'Storage-C1', 8, 'https://images.unsplash.com/photo-1581092160562-40aa4f7c036a?w=400', 'Range: -55°C to +125°C, Accuracy: ±0.5°C, Interface: 1-Wire', 'active'),
    
    (gen_random_uuid(), 'HC-SR04 Ultrasonic Sensor', 'Distance measurement sensor module', (SELECT id FROM categories WHERE name = 'Sensors' LIMIT 1), 'DIST-HCSR04', 35, 30, true, 4.99, 'Storage-C2', 10, 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400', 'Range: 2cm to 400cm, Accuracy: 3mm, Voltage: 5V DC', 'active'),
    
    (gen_random_uuid(), 'USB A to B Cable', 'Standard printer cable 2 meters', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'USB-AB-2M', 45, 40, true, 7.99, 'Storage-D1', 15, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Length: 2m, Connector A: USB-A Male, Connector B: USB-B Male', 'active'),
    
    (gen_random_uuid(), '9V Power Adapter', 'AC to DC power supply 1A output', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'PWR-9V-1A', 20, 18, true, 14.99, 'Storage-D2', 5, 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400', 'Input: 100-240V AC, Output: 9V DC 1A, Plug: 2.1mm center positive', 'active'),
    
    (gen_random_uuid(), 'Digital Multimeter', 'Basic digital multimeter for electronics', (SELECT id FROM categories WHERE name = 'Tools' LIMIT 1), 'DMM-BASIC', 15, 12, true, 29.99, 'Tool-Room', 3, 'https://images.unsplash.com/photo-1581092795442-6d4b9a146ab9?w=400', 'DC Voltage: 200mV-600V, AC Voltage: 2V-600V, Current: 2mA-10A', 'active'),
    
    (gen_random_uuid(), 'Soldering Iron Kit', 'Temperature controlled soldering station', (SELECT id FROM categories WHERE name = 'Tools' LIMIT 1), 'SOLDER-KIT', 12, 10, true, 45.99, 'Tool-Room', 2, 'https://images.unsplash.com/photo-1581092334102-f4a7d6c1146f?w=400', 'Power: 60W, Temperature: 200-480°C, Includes stand and tips', 'active'),
    
    (gen_random_uuid(), 'SG90 Servo Motor', 'Micro servo for robotics projects', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'SERVO-SG90', 40, 35, true, 8.99, 'Storage-B3', 10, 'https://images.unsplash.com/photo-1581092443284-9dd49dce9bfb?w=400', 'Torque: 1.8kg⋅cm, Speed: 0.1s/60°, Voltage: 4.8-6V', 'active'),
    
    (gen_random_uuid(), '16x2 LCD Display', 'Character LCD with I2C backpack', (SELECT id FROM categories WHERE name = 'Microcontrollers' LIMIT 1), 'LCD-16X2-I2C', 25, 22, true, 16.99, 'Storage-B4', 8, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Size: 16x2 characters, Interface: I2C, Backlight: Blue', 'active');

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
