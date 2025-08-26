-- Add Sample Products Query
-- These products will be displayed in the frontend

-- First, let's add some categories if they don't exist
INSERT INTO categories (id, name, description) 
VALUES 
    ('6f9041a1-90e8-4edb-8476-71ea0c9c60eb', 'Components', 'Electronic components and parts'),
    ('0b493ee2-5cf3-4f28-b66d-09d38ea6dff2', 'Cables & Connectors', 'Various cables and connection components'),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Sensors', 'Temperature, pressure, and other sensors'),
    ('b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'Microcontrollers', 'Arduino, Raspberry Pi, and other controllers'),
    ('c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'Tools', 'Measurement and testing equipment')
ON CONFLICT (id) DO NOTHING;

-- Now add sample products that will show up in frontend
INSERT INTO products (id, name, description, category_id, sku, quantity_total, quantity_available, is_returnable, unit_price, location, minimum_stock_level, image_url, specifications, tags, status) 
VALUES 
    -- Electronics Components
    ('p001-resistor-pack', 'Resistor Pack (100pcs)', 'Assorted carbon film resistors 1/4W', '6f9041a1-90e8-4edb-8476-71ea0c9c60eb', 'RES-PACK-100', 50, 45, true, 15.99, 'Storage-A1', 10, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Resistance: 1Ω to 10MΩ, Tolerance: ±5%, Power: 1/4W', '{"tags": ["resistors", "passive", "basic"]}', 'active'),
    
    ('p002-arduino-uno', 'Arduino Uno R3', 'Microcontroller board based on ATmega328P', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'ARD-UNO-R3', 25, 20, true, 24.99, 'Storage-B2', 5, 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400', 'MCU: ATmega328P, Clock: 16MHz, I/O Pins: 14 digital, 6 analog', '["arduino", "microcontroller", "development"]', 'active'),
    
    ('p003-jumper-wires', 'Jumper Wire Set', 'Male-to-male, male-to-female, female-to-female', '0b493ee2-5cf3-4f28-b66d-09d38ea6dff2', 'WIRE-JUMP-SET', 100, 85, true, 8.99, 'Storage-A2', 20, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Length: 20cm, Colors: 10 different, Quantity: 120 pieces', '["wires", "connections", "prototyping"]', 'active'),
    
    ('p004-breadboard', 'Half-Size Breadboard', 'Solderless breadboard for prototyping', '6f9041a1-90e8-4edb-8476-71ea0c9c60eb', 'BB-HALF-830', 40, 35, true, 6.99, 'Storage-A3', 15, 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=400', 'Tie Points: 830, Size: 83x55mm, Colors: White', '["breadboard", "prototyping", "solderless"]', 'active'),
    
    ('p005-led-pack', 'LED Assortment Pack', 'Mixed color 5mm LEDs (50 pieces)', '6f9041a1-90e8-4edb-8476-71ea0c9c60eb', 'LED-ASST-50', 60, 50, true, 12.99, 'Storage-A4', 12, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Colors: Red, Blue, Green, Yellow, White, Forward Voltage: 1.8-3.2V', '["led", "lighting", "indicators"]', 'active'),
    
    -- Sensors
    ('p006-temp-sensor', 'DS18B20 Temperature Sensor', 'Digital temperature sensor with 1-wire interface', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'TEMP-DS18B20', 30, 25, true, 9.99, 'Storage-C1', 8, 'https://images.unsplash.com/photo-1581092160562-40aa4f7c036a?w=400', 'Range: -55°C to +125°C, Accuracy: ±0.5°C, Interface: 1-Wire', '["temperature", "sensor", "digital"]', 'active'),
    
    ('p007-ultrasonic', 'HC-SR04 Ultrasonic Sensor', 'Distance measurement sensor module', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'DIST-HCSR04', 35, 30, true, 4.99, 'Storage-C2', 10, 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400', 'Range: 2cm to 400cm, Accuracy: 3mm, Voltage: 5V DC', '["ultrasonic", "distance", "sensor"]', 'active'),
    
    -- Cables & Connectors
    ('p008-usb-cable', 'USB A to B Cable', 'Standard printer cable 2 meters', '0b493ee2-5cf3-4f28-b66d-09d38ea6dff2', 'USB-AB-2M', 45, 40, true, 7.99, 'Storage-D1', 15, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Length: 2m, Connector A: USB-A Male, Connector B: USB-B Male', '["usb", "cable", "printer"]', 'active'),
    
    ('p009-power-adapter', '9V Power Adapter', 'AC to DC power supply 1A output', '0b493ee2-5cf3-4f28-b66d-09d38ea6dff2', 'PWR-9V-1A', 20, 18, true, 14.99, 'Storage-D2', 5, 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400', 'Input: 100-240V AC, Output: 9V DC 1A, Plug: 2.1mm center positive', '["power", "adapter", "supply"]', 'active'),
    
    -- Tools
    ('p010-multimeter', 'Digital Multimeter', 'Basic digital multimeter for electronics', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'DMM-BASIC', 15, 12, true, 29.99, 'Tool-Room', 3, 'https://images.unsplash.com/photo-1581092795442-6d4b9a146ab9?w=400', 'DC Voltage: 200mV-600V, AC Voltage: 2V-600V, Current: 2mA-10A', '["multimeter", "measurement", "testing"]', 'active'),
    
    ('p011-soldering-iron', 'Soldering Iron Kit', 'Temperature controlled soldering station', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'SOLDER-KIT', 12, 10, true, 45.99, 'Tool-Room', 2, 'https://images.unsplash.com/photo-1581092334102-f4a7d6c1146f?w=400', 'Power: 60W, Temperature: 200-480°C, Includes stand and tips', '["soldering", "tools", "electronics"]', 'active'),
    
    -- Advanced Components
    ('p012-servo-motor', 'SG90 Servo Motor', 'Micro servo for robotics projects', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'SERVO-SG90', 40, 35, true, 8.99, 'Storage-B3', 10, 'https://images.unsplash.com/photo-1581092443284-9dd49dce9bfb?w=400', 'Torque: 1.8kg⋅cm, Speed: 0.1s/60°, Voltage: 4.8-6V', '["servo", "motor", "robotics"]', 'active'),
    
    ('p013-lcd-display', '16x2 LCD Display', 'Character LCD with I2C backpack', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'LCD-16X2-I2C', 25, 22, true, 16.99, 'Storage-B4', 8, 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', 'Size: 16x2 characters, Interface: I2C, Backlight: Blue', '["lcd", "display", "i2c"]', 'active');

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
