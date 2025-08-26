from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

def create_sample_invoice_image():
    # Create a larger, higher resolution image for better OCR
    width, height = 1200, 1600
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Use larger, clearer fonts for better OCR recognition
    try:
        title_font = ImageFont.truetype("arial.ttf", 36)
        header_font = ImageFont.truetype("arial.ttf", 24)
        text_font = ImageFont.truetype("arial.ttf", 18)
        small_font = ImageFont.truetype("arial.ttf", 16)
    except:
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Colors - use higher contrast for better OCR
    blue = '#1E3A8A'
    black = '#000000'
    dark_gray = '#1F2937'
    medium_gray = '#4B5563'
    
    # Header with better contrast
    draw.rectangle([0, 0, width, 120], fill=blue)
    draw.text((40, 35), "UNIVERSITY EQUIPMENT INVOICE", fill='white', font=title_font)
    
    # Invoice details with better spacing
    y_pos = 160
    draw.text((40, y_pos), "INVOICE #: INV-2025-0042", fill=black, font=header_font)
    draw.text((40, y_pos + 35), f"Date: August 26, 2025", fill=dark_gray, font=text_font)
    draw.text((40, y_pos + 65), "Status: ISSUED", fill=dark_gray, font=text_font)
    
    # Student Information with clear labels
    y_pos = 300
    draw.text((40, y_pos), "STUDENT INFORMATION", fill=black, font=header_font)
    draw.line([40, y_pos + 30, 600, y_pos + 30], fill=black, width=2)
    
    student_info = [
        "Name: Sarah Johnson",
        "Student ID: STUD2025001", 
        "Email: sarah.johnson@university.edu",
        "Department: Computer Science",
        "Year: 3rd Year"
    ]
    
    for i, info in enumerate(student_info):
        draw.text((40, y_pos + 50 + (i * 30)), info, fill=dark_gray, font=text_font)
    
    # Equipment List with clear table structure
    y_pos = 520
    draw.text((40, y_pos), "EQUIPMENT ISSUED", fill=black, font=header_font)
    draw.line([40, y_pos + 30, width - 40, y_pos + 30], fill=black, width=2)
    
    # Table headers with better spacing
    headers_y = y_pos + 50
    draw.text((40, headers_y), "Item", fill=black, font=text_font)
    draw.text((450, headers_y), "SKU", fill=black, font=text_font)
    draw.text((650, headers_y), "Qty", fill=black, font=text_font)
    draw.text((750, headers_y), "Unit Price", fill=black, font=text_font)
    draw.text((950, headers_y), "Total", fill=black, font=text_font)
    
    # Underline headers
    draw.line([40, headers_y + 25, width - 40, headers_y + 25], fill=medium_gray, width=1)
    
    # Table items with better spacing
    items = [
        ("Olympus Microscope", "MIC-OLYMP-001", "1", "$2,500.00", "$2,500.00"),
        ("Microscope Slide Set", "SLO-BIOOD1", "2", "$45.00", "$90.00"),
        ("Laboratory Notebook", "NBLABOO1", "3", "$15.00", "$45.00")
    ]
    
    item_y = headers_y + 40
    for i, (item, sku, qty, unit_price, total) in enumerate(items):
        y = item_y + (i * 35)
        draw.text((40, y), item, fill=dark_gray, font=text_font)
        draw.text((450, y), sku, fill=dark_gray, font=text_font)
        draw.text((650, y), qty, fill=dark_gray, font=text_font)
        draw.text((750, y), unit_price, fill=dark_gray, font=text_font)
        draw.text((950, y), total, fill=dark_gray, font=text_font)
    
    # Total section with clear formatting
    total_y = item_y + 150
    draw.line([40, total_y, width - 40, total_y], fill=black, width=2)
    draw.text((750, total_y + 20), "Subtotal:", fill=black, font=text_font)
    draw.text((950, total_y + 20), "$2,635.00", fill=black, font=text_font)
    draw.text((750, total_y + 50), "Tax (8%):", fill=black, font=text_font)
    draw.text((950, total_y + 50), "$210.80", fill=black, font=text_font)
    draw.text((750, total_y + 85), "TOTAL:", fill=black, font=header_font)
    draw.text((950, total_y + 85), "$2,845.80", fill=black, font=header_font)
    
    # Terms and conditions
    terms_y = total_y + 160
    draw.text((40, terms_y), "TERMS & CONDITIONS", fill=black, font=header_font)
    draw.line([40, terms_y + 30, 600, terms_y + 30], fill=black, width=2)
    
    terms = [
        "• Equipment must be returned in original condition",
        "• Student is responsible for any damage or loss",
        "• Return date: September 26, 2025",
        "• Late return fee: $50 per day"
    ]
    
    for i, term in enumerate(terms):
        draw.text((40, terms_y + 50 + (i * 30)), term, fill=dark_gray, font=text_font)
    
    # Footer with clear contact info
    footer_y = height - 120
    draw.rectangle([0, footer_y, width, height], fill='#F9FAFB')
    draw.text((40, footer_y + 30), "University Equipment Management System", fill=medium_gray, font=text_font)
    draw.text((40, footer_y + 60), "Contact: equipment@university.edu | Phone: (555) 123-4567", fill=medium_gray, font=small_font)
    
    # Save the image with higher quality for better OCR
    output_path = "sample_invoice_sarah_johnson_hq.png"
    img.save(output_path, "PNG", quality=100, optimize=False)
    print(f"✅ High-quality invoice image created: {output_path}")
    print(f"📄 Invoice for: Sarah Johnson")
    print(f"💰 Total Value: $2,845.80") 
    print(f"📅 Date: August 26, 2025")
    print(f"🔍 OCR-optimized: Higher resolution, better contrast, larger fonts")
    
    return output_path

if __name__ == "__main__":
    create_sample_invoice_image()
