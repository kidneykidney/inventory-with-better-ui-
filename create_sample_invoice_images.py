#!/usr/bin/env python3
"""
Sample Invoice Image Generator
Creates invoice images (PNG/JPEG) for testing OCR functionality
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_sample_invoice_image():
    """Create a simple invoice image for OCR testing"""
    
    # Create output directory
    output_dir = "sample_invoices"
    os.makedirs(output_dir, exist_ok=True)
    
    # Image settings
    width, height = 800, 1000
    background_color = (255, 255, 255)  # White
    text_color = (0, 0, 0)  # Black
    
    # Create image
    img = Image.new('RGB', (width, height), background_color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a better font, fall back to default if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 28)
        header_font = ImageFont.truetype("arial.ttf", 16)
        normal_font = ImageFont.truetype("arial.ttf", 12)
    except:
        # Fallback to default font
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
    
    # Title
    y_pos = 40
    draw.text((50, y_pos), "UNIVERSITY EQUIPMENT LENDING INVOICE", fill=text_color, font=title_font)
    
    # Invoice details
    y_pos += 80
    draw.text((50, y_pos), "Invoice #: INV-2025-004", fill=text_color, font=header_font)
    draw.text((400, y_pos), "Date: August 26, 2025", fill=text_color, font=header_font)
    
    y_pos += 30
    draw.text((50, y_pos), "Student ID: STU54321", fill=text_color, font=header_font)
    draw.text((400, y_pos), "Due Date: September 20, 2025", fill=text_color, font=header_font)
    
    y_pos += 30
    draw.text((50, y_pos), "Student Name: Emma Wilson", fill=text_color, font=header_font)
    draw.text((400, y_pos), "Department: Biology", fill=text_color, font=header_font)
    
    y_pos += 30
    draw.text((50, y_pos), "Email: emma.wilson@university.edu", fill=text_color, font=header_font)
    draw.text((400, y_pos), "Year: 2nd Year", fill=text_color, font=header_font)
    
    # Items section
    y_pos += 60
    draw.text((50, y_pos), "BORROWED EQUIPMENT:", fill=text_color, font=header_font)
    
    # Table headers
    y_pos += 40
    draw.text((50, y_pos), "Item", fill=text_color, font=normal_font)
    draw.text((250, y_pos), "SKU", fill=text_color, font=normal_font)
    draw.text((350, y_pos), "Qty", fill=text_color, font=normal_font)
    draw.text((400, y_pos), "Unit Value", fill=text_color, font=normal_font)
    draw.text((500, y_pos), "Total Value", fill=text_color, font=normal_font)
    draw.text((600, y_pos), "Return Date", fill=text_color, font=normal_font)
    
    # Draw line under headers
    y_pos += 20
    draw.line((50, y_pos, 750, y_pos), fill=text_color, width=1)
    
    # Items
    items = [
        ["Microscope", "MIC-OLYMP-001", "1", "$2,500.00", "$2,500.00", "Sept 20, 2025"],
        ["Slide Set", "SLD-BIO-001", "1", "$45.00", "$45.00", "Sept 20, 2025"],
        ["Petri Dishes", "PTR-GLASS-001", "10", "$2.00", "$20.00", "Sept 20, 2025"],
        ["Lab Notebook", "NB-LAB-001", "1", "$15.00", "$15.00", "Sept 20, 2025"]
    ]
    
    for item in items:
        y_pos += 25
        draw.text((50, y_pos), item[0], fill=text_color, font=normal_font)
        draw.text((250, y_pos), item[1], fill=text_color, font=normal_font)
        draw.text((350, y_pos), item[2], fill=text_color, font=normal_font)
        draw.text((400, y_pos), item[3], fill=text_color, font=normal_font)
        draw.text((500, y_pos), item[4], fill=text_color, font=normal_font)
        draw.text((600, y_pos), item[5], fill=text_color, font=normal_font)
    
    # Total
    y_pos += 40
    draw.line((50, y_pos, 750, y_pos), fill=text_color, width=1)
    y_pos += 10
    draw.text((400, y_pos), "TOTAL VALUE:", fill=text_color, font=header_font)
    draw.text((500, y_pos), "$2,580.00", fill=text_color, font=header_font)
    
    # Terms
    y_pos += 60
    draw.text((50, y_pos), "TERMS AND CONDITIONS:", fill=text_color, font=header_font)
    y_pos += 30
    terms = [
        "1. All equipment must be returned in good condition by the due date.",
        "2. Late returns incur $10 per day per item fee.",
        "3. Damaged/lost equipment charged at replacement cost.",
        "4. Student responsible for care and security of items.",
        "5. This invoice serves as lending agreement."
    ]
    
    for term in terms:
        draw.text((50, y_pos), term, fill=text_color, font=normal_font)
        y_pos += 25
    
    # Signatures
    y_pos += 40
    draw.text((50, y_pos), "Student Signature: ___________________", fill=text_color, font=normal_font)
    draw.text((450, y_pos), "Date: _________", fill=text_color, font=normal_font)
    
    y_pos += 30
    draw.text((50, y_pos), "Staff Signature: _____________________", fill=text_color, font=normal_font)
    draw.text((450, y_pos), "Date: _________", fill=text_color, font=normal_font)
    
    # Footer
    y_pos += 60
    draw.text((50, y_pos), "University Equipment Management System", fill=text_color, font=normal_font)
    y_pos += 15
    draw.text((50, y_pos), "Contact: equipment@university.edu | Phone: (555) 123-4567", fill=text_color, font=normal_font)
    
    # Save as PNG and JPEG
    png_filename = os.path.join(output_dir, "sample_invoice_004.png")
    jpg_filename = os.path.join(output_dir, "sample_invoice_004.jpg")
    
    img.save(png_filename, 'PNG')
    img.save(jpg_filename, 'JPEG', quality=95)
    
    print(f"Created image invoices:")
    print(f"  • {png_filename}")
    print(f"  • {jpg_filename}")
    
    return png_filename, jpg_filename

def create_simple_text_invoice():
    """Create a very simple, clean text-based invoice image for better OCR"""
    
    output_dir = "sample_invoices"
    os.makedirs(output_dir, exist_ok=True)
    
    # Simple white background with black text
    width, height = 600, 800
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        title_font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    y = 50
    
    # Simple, clean layout for better OCR
    draw.text((50, y), "EQUIPMENT LENDING INVOICE", fill=(0,0,0), font=title_font)
    y += 50
    
    draw.text((50, y), "Invoice Number: INV-2025-005", fill=(0,0,0), font=font)
    y += 25
    draw.text((50, y), "Date: August 26, 2025", fill=(0,0,0), font=font)
    y += 25
    draw.text((50, y), "Student ID: STU98765", fill=(0,0,0), font=font)
    y += 25
    draw.text((50, y), "Student Name: Alex Rodriguez", fill=(0,0,0), font=font)
    y += 25
    draw.text((50, y), "Department: Chemistry", fill=(0,0,0), font=font)
    y += 25
    draw.text((50, y), "Email: alex.rodriguez@university.edu", fill=(0,0,0), font=font)
    y += 50
    
    draw.text((50, y), "EQUIPMENT:", fill=(0,0,0), font=title_font)
    y += 35
    
    # Simple item list
    items = [
        "Analytical Balance - BAL-METT-001 - Quantity: 1 - Value: $3,200.00",
        "pH Meter - PH-HANNA-001 - Quantity: 1 - Value: $450.00", 
        "Beaker Set - BKR-GLASS-001 - Quantity: 1 - Value: $85.00",
        "Safety Goggles - SAF-GOG-001 - Quantity: 1 - Value: $25.00"
    ]
    
    for item in items:
        draw.text((50, y), item, fill=(0,0,0), font=font)
        y += 25
    
    y += 25
    draw.text((50, y), "TOTAL VALUE: $3,760.00", fill=(0,0,0), font=title_font)
    y += 25
    draw.text((50, y), "DUE DATE: September 25, 2025", fill=(0,0,0), font=title_font)
    
    # Save the simple version
    simple_filename = os.path.join(output_dir, "sample_invoice_simple.png")
    img.save(simple_filename, 'PNG')
    
    print(f"Created simple invoice: {simple_filename}")
    return simple_filename

if __name__ == "__main__":
    print("Creating sample invoice images for OCR testing...")
    
    # Create detailed invoice image
    png_file, jpg_file = create_sample_invoice_image()
    
    # Create simple invoice for better OCR
    simple_file = create_simple_text_invoice()
    
    print(f"\n✅ Sample invoice images created successfully!")
    print("These image files can be uploaded to test the OCR functionality.")
