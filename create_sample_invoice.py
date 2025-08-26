#!/usr/bin/env python3
"""
Sample Invoice PDF Generator
Creates realistic invoice PDFs for testing the OCR functionality
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime, timedelta
import os

def create_sample_invoice():
    # Create output directory if it doesn't exist
    output_dir = "sample_invoices"
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate invoice filename
    filename = os.path.join(output_dir, "sample_invoice_001.pdf")
    
    # Create PDF document
    doc = SimpleDocTemplate(filename, pagesize=A4,
                          rightMargin=72, leftMargin=72,
                          topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    invoice_header_style = ParagraphStyle(
        'InvoiceHeader',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6,
        alignment=TA_LEFT
    )
    
    # Invoice Header
    story.append(Paragraph("UNIVERSITY EQUIPMENT LENDING INVOICE", title_style))
    story.append(Spacer(1, 12))
    
    # Invoice Details Table
    invoice_data = [
        ["Invoice #:", "INV-2025-001", "Date:", "August 26, 2025"],
        ["Student ID:", "STU12345", "Due Date:", "September 10, 2025"],
        ["Student Name:", "John Smith", "Department:", "Computer Science"],
        ["Email:", "john.smith@university.edu", "Year:", "3rd Year"]
    ]
    
    invoice_table = Table(invoice_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    invoice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(invoice_table)
    story.append(Spacer(1, 20))
    
    # Items Header
    story.append(Paragraph("BORROWED EQUIPMENT", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    # Items Table
    items_data = [
        ["Item", "SKU", "Quantity", "Unit Value", "Total Value", "Return Date"],
        ["Dell Laptop XPS 15", "DELL-XPS15-001", "1", "$1,200.00", "$1,200.00", "Sept 10, 2025"],
        ["Wireless Mouse", "MSE-LOGIT-001", "1", "$25.00", "$25.00", "Sept 10, 2025"],
        ["USB-C Hub", "HUB-USBC-001", "1", "$45.00", "$45.00", "Sept 10, 2025"],
        ["Power Adapter", "PWR-DELL-001", "1", "$80.00", "$80.00", "Sept 10, 2025"],
        ["", "", "", "TOTAL VALUE:", "$1,350.00", ""]
    ]
    
    items_table = Table(items_data, colWidths=[2.5*inch, 1.5*inch, 0.8*inch, 1*inch, 1*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Quantity
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),   # Values
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (3, -1), (4, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (3, -1), (4, -1), 12),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # Terms and Conditions
    story.append(Paragraph("TERMS AND CONDITIONS", styles['Heading3']))
    story.append(Spacer(1, 10))
    
    terms_text = """
    <para>
    1. All borrowed equipment must be returned in good condition by the due date.<br/>
    2. Late returns may incur additional fees of $10 per day per item.<br/>
    3. Damaged or lost equipment will be charged at replacement cost.<br/>
    4. Student is responsible for the care and security of all borrowed items.<br/>
    5. This invoice serves as a lending agreement and receipt.
    </para>
    """
    
    story.append(Paragraph(terms_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Signatures
    signature_data = [
        ["Student Signature: _________________", "Date: _________"],
        ["Staff Signature: ___________________", "Date: _________"]
    ]
    
    signature_table = Table(signature_data, colWidths=[4*inch, 2*inch])
    signature_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
    ]))
    
    story.append(signature_table)
    
    # Footer
    story.append(Spacer(1, 30))
    footer_text = "University Equipment Management System | Contact: equipment@university.edu | Phone: (555) 123-4567"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)))
    
    # Build PDF
    doc.build(story)
    print(f"Sample invoice created: {filename}")
    return filename

def create_multiple_samples():
    """Create multiple sample invoices with different data"""
    
    # Sample data for different invoices
    samples = [
        {
            "invoice_num": "INV-2025-002",
            "student_id": "STU67890", 
            "student_name": "Sarah Johnson",
            "department": "Mechanical Engineering",
            "email": "sarah.j@university.edu",
            "items": [
                ["3D Printer Filament", "3DP-FIL-PLA", "2", "$30.00", "$60.00"],
                ["Digital Calipers", "CAL-DIG-001", "1", "$150.00", "$150.00"],
                ["Engineering Calculator", "CALC-ENG-001", "1", "$120.00", "$120.00"],
            ]
        },
        {
            "invoice_num": "INV-2025-003",
            "student_id": "STU11111",
            "student_name": "Mike Chen", 
            "department": "Physics",
            "email": "m.chen@university.edu",
            "items": [
                ["Oscilloscope", "OSC-TEK-001", "1", "$800.00", "$800.00"],
                ["Function Generator", "FG-RIGOL-001", "1", "$350.00", "$350.00"],
                ["Multimeter", "MM-FLUKE-001", "1", "$200.00", "$200.00"],
            ]
        }
    ]
    
    output_dir = "sample_invoices"
    os.makedirs(output_dir, exist_ok=True)
    
    created_files = []
    
    for i, sample in enumerate(samples):
        filename = os.path.join(output_dir, f"sample_invoice_{sample['invoice_num'].split('-')[-1]}.pdf")
        
        doc = SimpleDocTemplate(filename, pagesize=A4,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                   fontSize=24, spaceAfter=30, alignment=TA_CENTER, textColor=colors.darkblue)
        
        # Header
        story.append(Paragraph("UNIVERSITY EQUIPMENT LENDING INVOICE", title_style))
        story.append(Spacer(1, 12))
        
        # Invoice details
        invoice_data = [
            ["Invoice #:", sample["invoice_num"], "Date:", "August 26, 2025"],
            ["Student ID:", sample["student_id"], "Due Date:", "September 15, 2025"],
            ["Student Name:", sample["student_name"], "Department:", sample["department"]],
            ["Email:", sample["email"], "Year:", "Graduate"]
        ]
        
        invoice_table = Table(invoice_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        invoice_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(invoice_table)
        story.append(Spacer(1, 20))
        
        # Items
        story.append(Paragraph("BORROWED EQUIPMENT", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        items_header = [["Item", "SKU", "Quantity", "Unit Value", "Total Value", "Return Date"]]
        items_data = items_header + [[item[0], item[1], item[2], item[3], item[4], "Sept 15, 2025"] for item in sample["items"]]
        
        total_value = sum(float(item[4].replace('$', '').replace(',', '')) for item in sample["items"])
        items_data.append(["", "", "", "TOTAL VALUE:", f"${total_value:,.2f}", ""])
        
        items_table = Table(items_data, colWidths=[2.5*inch, 1.5*inch, 0.8*inch, 1*inch, 1*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),
            ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (3, -1), (4, -1), 'Helvetica-Bold'),
        ]))
        
        story.append(items_table)
        story.append(Spacer(1, 40))
        
        # Simple footer
        footer_text = "University Equipment Management System"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], 
                                                         fontSize=8, alignment=TA_CENTER)))
        
        doc.build(story)
        created_files.append(filename)
        print(f"Created: {filename}")
    
    return created_files

if __name__ == "__main__":
    print("Creating sample invoice PDFs for OCR testing...")
    
    # Create main sample invoice
    main_invoice = create_sample_invoice()
    
    # Create additional samples
    additional_invoices = create_multiple_samples()
    
    print(f"\n✅ Successfully created {len(additional_invoices) + 1} sample invoices:")
    print(f"   • {main_invoice}")
    for invoice in additional_invoices:
        print(f"   • {invoice}")
    
    print(f"\nSample invoices are ready for OCR testing!")
    print("You can upload these PDFs using the OCR feature in your Invoice & Billing system.")
