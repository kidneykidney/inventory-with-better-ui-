#!/usr/bin/env python3
"""
Create an HTML invoice from the OCR-extracted data
"""

from datetime import datetime, timedelta

def create_invoice_html():
    # OCR extracted data from the image
    student_data = {
        "student_name": "Alex Rodriguez",
        "student_id": "STU2023078", 
        "student_email": "alex.rodriguez@university.edu",
        "lender_name": "Ms Lisa Thompson",
        "lending_date": datetime.now().strftime("%Y-%m-%d"),
        "lending_time": "09:00",
        "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "invoice_type": "lending",
        "notes": "Equipment lending - see attached invoice for details"
    }
    
    # Extracted components
    components = [
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
    
    total_value = sum(item["total_value"] for item in components)
    
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Equipment Lending Invoice</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .invoice {{
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #1976D2;
            margin: 0;
            font-size: 28px;
        }}
        .header h2 {{
            color: #666;
            margin: 5px 0 0 0;
            font-weight: normal;
        }}
        .info-section {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }}
        .info-box {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            width: 48%;
        }}
        .info-box h3 {{
            color: #1976D2;
            margin: 0 0 15px 0;
            font-size: 16px;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 5px;
        }}
        .info-row {{
            margin-bottom: 10px;
        }}
        .label {{
            font-weight: bold;
            color: #333;
            display: inline-block;
            width: 120px;
        }}
        .value {{
            color: #666;
        }}
        .components-section {{
            margin-top: 30px;
        }}
        .components-title {{
            color: #1976D2;
            font-size: 20px;
            margin-bottom: 15px;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 5px;
        }}
        .components-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }}
        .components-table th {{
            background: #1976D2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }}
        .components-table td {{
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }}
        .components-table tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        .total-section {{
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 6px;
        }}
        .total-value {{
            font-size: 24px;
            font-weight: bold;
            color: #1976D2;
        }}
        .notes-section {{
            margin-top: 30px;
            padding: 20px;
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            border-radius: 0 6px 6px 0;
        }}
        .notes-title {{
            color: #e65100;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .footer {{
            margin-top: 40px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }}
        .status-badge {{
            display: inline-block;
            background: #4caf50;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>Equipment Lending Invoice</h1>
            <h2>College Incubation Inventory System</h2>
            <p style="margin: 10px 0; color: #666;">Invoice Date: {student_data['lending_date']}</p>
        </div>
        
        <div class="info-section">
            <div class="info-box">
                <h3>👤 Student Information</h3>
                <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">{student_data['student_name']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Student ID:</span>
                    <span class="value">{student_data['student_id']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">{student_data['student_email']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Type:</span>
                    <span class="value status-badge">{student_data['invoice_type'].upper()}</span>
                </div>
            </div>
            
            <div class="info-box">
                <h3>👨‍💼 Lending Information</h3>
                <div class="info-row">
                    <span class="label">Issued By:</span>
                    <span class="value">{student_data['lender_name']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Lending Date:</span>
                    <span class="value">{student_data['lending_date']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Lending Time:</span>
                    <span class="value">{student_data['lending_time']}</span>
                </div>
                <div class="info-row">
                    <span class="label">Due Date:</span>
                    <span class="value">{student_data['due_date']}</span>
                </div>
            </div>
        </div>
        
        <div class="components-section">
            <h3 class="components-title">📦 Extracted Components ({len(components)})</h3>
            <table class="components-table">
                <thead>
                    <tr>
                        <th>Component Name</th>
                        <th>SKU/Code</th>
                        <th>Quantity</th>
                        <th>Unit Value</th>
                        <th>Total Value</th>
                        <th>Condition</th>
                    </tr>
                </thead>
                <tbody>
"""

    # Add component rows
    for component in components:
        html_content += f"""
                    <tr>
                        <td>{component['name']}</td>
                        <td>{component['sku']}</td>
                        <td>{component['quantity']}</td>
                        <td>${component['unit_value']:.2f}</td>
                        <td>${component['total_value']:.2f}</td>
                        <td>{component['condition']}</td>
                    </tr>
"""

    html_content += f"""
                </tbody>
            </table>
            
            <div class="total-section">
                <p><strong>Total Equipment Value: <span class="total-value">${total_value:.2f}</span></strong></p>
            </div>
        </div>
        
        <div class="notes-section">
            <div class="notes-title">📝 Notes:</div>
            <p>{student_data['notes']}</p>
        </div>
        
        <div class="footer">
            <p><strong>College Incubation Inventory System</strong></p>
            <p>Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | Invoice processed via OCR</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html_content

if __name__ == "__main__":
    # Generate the HTML invoice
    html_invoice = create_invoice_html()
    
    # Save to file
    with open("invoice_output.html", "w", encoding="utf-8") as f:
        f.write(html_invoice)
    
    print("✅ Invoice HTML created successfully!")
    print("📄 File saved as: invoice_output.html")
    print("🌐 You can open this file in a browser and:")
    print("   1. View the formatted invoice")
    print("   2. Print to PDF")  
    print("   3. Take a screenshot")
    print("   4. Use browser's 'Save as image' feature")