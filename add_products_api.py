#!/usr/bin/env python3
"""
Script to add sample products via the API
Run this while your FastAPI server is running on localhost:8000
"""

import requests
import json
import uuid

API_BASE = "http://localhost:8000"

# Sample products data
sample_products = [
    {
        "name": "Arduino Nano",
        "description": "Compact microcontroller board perfect for projects",
        "category_id": "b2c3d4e5-f6g7-8901-2345-678901bcdefg",  # Microcontrollers
        "sku": "ARD-NANO-33",
        "quantity_total": 30,
        "quantity_available": 28,
        "is_returnable": True,
        "unit_price": 22.99,
        "location": "Storage-B1",
        "minimum_stock_level": 5,
        "image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400",
        "specifications": "MCU: ATmega328P, Clock: 16MHz, Size: 18x45mm",
        "tags": ["arduino", "microcontroller", "compact"]
    },
    {
        "name": "Raspberry Pi 4 Model B",
        "description": "Single board computer with quad-core ARM processor",
        "category_id": "b2c3d4e5-f6g7-8901-2345-678901bcdefg",  # Microcontrollers
        "sku": "RPI-4B-4GB",
        "quantity_total": 15,
        "quantity_available": 12,
        "is_returnable": True,
        "unit_price": 79.99,
        "location": "Storage-B5",
        "minimum_stock_level": 3,
        "image_url": "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=400",
        "specifications": "RAM: 4GB, CPU: Quad-core ARM Cortex-A72, USB: 2x USB 3.0",
        "tags": ["raspberry-pi", "computer", "linux"]
    },
    {
        "name": "ESP32 Development Board",
        "description": "WiFi and Bluetooth enabled microcontroller",
        "category_id": "b2c3d4e5-f6g7-8901-2345-678901bcdefg",  # Microcontrollers
        "sku": "ESP32-DEVKIT",
        "quantity_total": 25,
        "quantity_available": 20,
        "is_returnable": True,
        "unit_price": 12.99,
        "location": "Storage-B6",
        "minimum_stock_level": 5,
        "image_url": "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400",
        "specifications": "WiFi: 802.11 b/g/n, Bluetooth: 4.2, Flash: 4MB",
        "tags": ["esp32", "wifi", "bluetooth", "iot"]
    },
    {
        "name": "Potentiometer 10K",
        "description": "Linear taper rotary potentiometer",
        "category_id": "6f9041a1-90e8-4edb-8476-71ea0c9c60eb",  # Components
        "sku": "POT-10K-LINEAR",
        "quantity_total": 75,
        "quantity_available": 65,
        "is_returnable": True,
        "unit_price": 2.99,
        "location": "Storage-A5",
        "minimum_stock_level": 20,
        "image_url": "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400",
        "specifications": "Resistance: 10kΩ, Taper: Linear, Shaft: 6mm",
        "tags": ["potentiometer", "variable", "resistor"]
    },
    {
        "name": "Capacitor Kit",
        "description": "Electrolytic capacitors assortment (50 pieces)",
        "category_id": "6f9041a1-90e8-4edb-8476-71ea0c9c60eb",  # Components
        "sku": "CAP-ELEC-KIT",
        "quantity_total": 40,
        "quantity_available": 35,
        "is_returnable": True,
        "unit_price": 18.99,
        "location": "Storage-A6",
        "minimum_stock_level": 8,
        "image_url": "https://images.unsplash.com/photo-1581092443284-9dd49dce9bfb?w=400",
        "specifications": "Values: 1µF to 1000µF, Voltage: 16V to 50V, Quantity: 50pcs",
        "tags": ["capacitors", "electrolytic", "passive"]
    }
]

def add_categories():
    """Add required categories first"""
    categories = [
        {
            "name": "Microcontrollers",
            "description": "Arduino, Raspberry Pi, ESP32 and other development boards"
        },
        {
            "name": "Components", 
            "description": "Electronic components and parts"
        },
        {
            "name": "Sensors",
            "description": "Temperature, pressure, and other sensors"  
        },
        {
            "name": "Cables & Connectors",
            "description": "Various cables and connection components"
        },
        {
            "name": "Tools",
            "description": "Measurement and testing equipment"
        }
    ]
    
    for category in categories:
        try:
            response = requests.post(f"{API_BASE}/categories", json=category)
            if response.status_code == 200:
                print(f"✅ Added category: {category['name']}")
            else:
                print(f"⚠️  Category {category['name']} might already exist")
        except Exception as e:
            print(f"❌ Error adding category {category['name']}: {e}")

def add_products():
    """Add sample products via API"""
    print("Adding sample products...")
    
    for product in sample_products:
        try:
            response = requests.post(f"{API_BASE}/products", json=product)
            if response.status_code == 200:
                print(f"✅ Added product: {product['name']} (SKU: {product['sku']})")
            else:
                print(f"❌ Failed to add {product['name']}: {response.text}")
        except Exception as e:
            print(f"❌ Error adding {product['name']}: {e}")

def verify_products():
    """Verify products were added by fetching them"""
    try:
        response = requests.get(f"{API_BASE}/products")
        if response.status_code == 200:
            products = response.json()
            print(f"\n📊 Total products in system: {len(products)}")
            print("\n🏷️  Available products:")
            for product in products[-10:]:  # Show last 10 products
                print(f"   • {product['name']} - ${product['unit_price']} ({product['quantity_available']} available)")
        else:
            print(f"❌ Error fetching products: {response.text}")
    except Exception as e:
        print(f"❌ Error verifying products: {e}")

if __name__ == "__main__":
    print("🚀 Adding sample products to inventory system...")
    print(f"API URL: {API_BASE}")
    
    # First add categories
    add_categories()
    print()
    
    # Then add products
    add_products()
    print()
    
    # Verify everything was added
    verify_products()
    
    print("\n✅ Done! Check your frontend at http://localhost:3000 to see the new products!")
