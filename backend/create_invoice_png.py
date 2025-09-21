#!/usr/bin/env python3
"""
Create a PNG invoice image from the OCR extracted data
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_invoice_png():
    # Create a white background image
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a better font, fallback to default if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 24)
        header_font = ImageFont.truetype("arial.ttf", 16)
        normal_font = ImageFont.truetype("arial.ttf", 12)
        small_font = ImageFont.truetype("arial.ttf", 10)
    except:
        # Fallback to default font
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Colors
    header_color = '#2E5BBA'  # Blue
    text_color = '#333333'    # Dark gray
    line_color = '#CCCCCC'    # Light gray
    
    y_pos = 40
    
    # Header
    draw.text((50, y_pos), "EQUIPMENT LENDING INVOICE", font=title_font, fill=header_color)
    y_pos += 50
    
    # Invoice details
    draw.text((50, y_pos), "Invoice #: LA-2025-001", font=normal_font, fill=text_color)
    draw.text((600, y_pos), "Date: September 20, 2025", font=normal_font, fill=text_color)
    y_pos += 40
    
    # Student Information Section
    draw.text((50, y_pos), "STUDENT INFORMATION", font=header_font, fill=header_color)
    y_pos += 30
    
    draw.text((50, y_pos), f"Student Name: Alex Rodriguez", font=normal_font, fill=text_color)
    y_pos += 25
    draw.text((50, y_pos), f"Student ID: STU2023078", font=normal_font, fill=text_color)
    y_pos += 25
    draw.text((50, y_pos), f"Email: alex.rodriguez@university.edu", font=normal_font, fill=text_color)
    y_pos += 40
    
    # Lending Information Section
    draw.text((50, y_pos), "LENDING INFORMATION", font=header_font, fill=header_color)
    y_pos += 30
    
    draw.text((50, y_pos), f"Lender: Ms Lisa Thompson", font=normal_font, fill=text_color)
    y_pos += 25
    draw.text((50, y_pos), f"Lending Date: September 20, 2025", font=normal_font, fill=text_color)
    y_pos += 25
    draw.text((50, y_pos), f"Due Date: October 20, 2025", font=normal_font, fill=text_color)
    y_pos += 25
    draw.text((50, y_pos), f"Invoice Type: Lending", font=normal_font, fill=text_color)
    y_pos += 40
    
    # Equipment Section
    draw.text((50, y_pos), "EQUIPMENT DETAILS", font=header_font, fill=header_color)
    y_pos += 30
    
    # Table header
    draw.line([(50, y_pos), (750, y_pos)], fill=line_color, width=1)
    y_pos += 10
    
    draw.text((50, y_pos), "Item", font=normal_font, fill=text_color)
    draw.text((300, y_pos), "SKU", font=normal_font, fill=text_color)
    draw.text((400, y_pos), "Qty", font=normal_font, fill=text_color)
    draw.text((450, y_pos), "Unit Value", font=normal_font, fill=text_color)
    draw.text((550, y_pos), "Total Value", font=normal_font, fill=text_color)
    draw.text((650, y_pos), "Condition", font=normal_font, fill=text_color)
    y_pos += 25
    
    draw.line([(50, y_pos), (750, y_pos)], fill=line_color, width=1)
    y_pos += 15
    
    # Equipment items
    items = [
        {
            "name": "Caliper Digital 6-inch",
            "sku": "AUTO001",
            "quantity": 1,
            "unit_value": 45.00,
            "total_value": 45.00,
            "condition": "Good"
        },
        {
            "name": "Micrometer Set",
            "sku": "AUTO002", 
            "quantity": 1,
            "unit_value": 89.50,
            "total_value": 89.50,
            "condition": "Good"
        }
    ]
    
    total_amount = 0
    for item in items:
        draw.text((50, y_pos), item["name"], font=normal_font, fill=text_color)
        draw.text((300, y_pos), item["sku"], font=normal_font, fill=text_color)
        draw.text((400, y_pos), str(item["quantity"]), font=normal_font, fill=text_color)
        draw.text((450, y_pos), f"${item['unit_value']:.2f}", font=normal_font, fill=text_color)
        draw.text((550, y_pos), f"${item['total_value']:.2f}", font=normal_font, fill=text_color)
        draw.text((650, y_pos), item["condition"], font=normal_font, fill=text_color)
        total_amount += item["total_value"]
        y_pos += 25
    
    # Total line
    y_pos += 10
    draw.line([(450, y_pos), (750, y_pos)], fill=line_color, width=2)
    y_pos += 15
    
    draw.text((450, y_pos), "TOTAL:", font=header_font, fill=text_color)
    draw.text((550, y_pos), f"${total_amount:.2f}", font=header_font, fill=text_color)
    y_pos += 40
    
    # Terms and Conditions
    draw.text((50, y_pos), "TERMS & CONDITIONS", font=header_font, fill=header_color)
    y_pos += 25
    
    terms = [
        "• Equipment must be returned by the due date in good condition",
        "• Student is responsible for any damage or loss",
        "• Late returns may incur additional fees",
        "• Equipment should be used only for educational purposes"
    ]
    
    for term in terms:
        draw.text((50, y_pos), term, font=small_font, fill=text_color)
        y_pos += 20
    
    y_pos += 20
    
    # Signatures
    draw.text((50, y_pos), "SIGNATURES", font=header_font, fill=header_color)
    y_pos += 30
    
    draw.text((50, y_pos), "Student Signature: ________________________", font=normal_font, fill=text_color)
    draw.text((450, y_pos), "Date: ___________", font=normal_font, fill=text_color)
    y_pos += 40
    
    draw.text((50, y_pos), "Staff Signature: ________________________", font=normal_font, fill=text_color)
    draw.text((450, y_pos), "Date: ___________", font=normal_font, fill=text_color)
    y_pos += 60
    
    # Footer
    draw.text((50, y_pos), "College Incubation Inventory System", font=small_font, fill=line_color)
    draw.text((450, y_pos), "Generated by OCR Bulk Upload System", font=small_font, fill=line_color)
    
    # Save the image
    output_path = "equipment_lending_invoice.png"
    img.save(output_path, "PNG", quality=95)
    
    print(f"✅ Invoice PNG created successfully!")
    print(f"📁 Saved as: {os.path.abspath(output_path)}")
    print(f"🖼️  Image size: {width}x{height} pixels")
    print(f"💰 Total value: ${total_amount:.2f}")
    
    return output_path

if __name__ == "__main__":
    create_invoice_png()