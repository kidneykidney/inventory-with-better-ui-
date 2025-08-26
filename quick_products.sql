-- Quick products to add for immediate testing
-- Run these directly in pgAdmin Query Tool

-- Add a few quick products that will show immediately in frontend
INSERT INTO products (id, name, description, category_id, sku, quantity_total, quantity_available, is_returnable, unit_price, location, minimum_stock_level, image_url, specifications, status) 
VALUES 
    (gen_random_uuid(), 'iPhone Lightning Cable', 'MFi certified lightning to USB-A cable', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'CABLE-LIGHT-1M', 50, 45, true, 19.99, 'Storage-Cables', 10, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Length: 1m, MFi Certified, Fast Charging Support', 'active'),
    
    (gen_random_uuid(), 'Wireless Mouse', 'Ergonomic wireless optical mouse', (SELECT id FROM categories WHERE name = 'Tools' LIMIT 1), 'MOUSE-WIRELESS', 20, 18, true, 24.99, 'Tool-Room', 5, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 'Connection: 2.4GHz Wireless, DPI: 1600, Battery: AA x2', 'active'),
    
    (gen_random_uuid(), 'USB-C Hub', '7-in-1 USB-C multiport adapter', (SELECT id FROM categories WHERE name = 'Cables & Connectors' LIMIT 1), 'HUB-USBC-7IN1', 15, 12, true, 49.99, 'Storage-Adapters', 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Ports: 3x USB 3.0, HDMI 4K, SD/microSD, USB-C PD', 'active'),
    
    (gen_random_uuid(), 'Bluetooth Speaker', 'Portable waterproof Bluetooth speaker', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'SPEAKER-BT-PORT', 25, 20, true, 39.99, 'Electronics-Shelf', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Bluetooth: 5.0, Battery: 12 hours, Waterproof: IPX7', 'active'),
    
    (gen_random_uuid(), 'Power Bank 10000mAh', 'High-capacity portable power bank', (SELECT id FROM categories WHERE name = 'Components' LIMIT 1), 'POWERBANK-10K', 30, 25, true, 29.99, 'Electronics-Shelf', 8, 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400', 'Capacity: 10000mAh, Ports: 2x USB-A + USB-C, Fast Charge', 'active');

-- Verify the products were added
SELECT name, sku, quantity_available, unit_price, status FROM products WHERE status = 'active' ORDER BY name;
