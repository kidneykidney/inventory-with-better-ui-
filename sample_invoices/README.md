# Sample Invoice Test Files for OCR Testing

This directory contains various sample invoice files created for testing the OCR (Optical Character Recognition) functionality of the Invoice & Billing system.

## Files Created

### PDF Files (3 files):
- **sample_invoice_001.pdf** - Comprehensive university equipment lending invoice with multiple items
- **sample_invoice_002.pdf** - Mechanical Engineering department invoice with specialized equipment
- **sample_invoice_003.pdf** - Physics department invoice with laboratory instruments

### Image Files (3 files):
- **sample_invoice_004.png** - Detailed biology department invoice as PNG image
- **sample_invoice_004.jpg** - Same biology invoice as JPEG image
- **sample_invoice_simple.png** - Simple, clean chemistry department invoice optimized for OCR

## Sample Data Included

Each invoice contains realistic university equipment lending data:

### Student Information:
- Student ID (e.g., STU12345, STU67890)
- Student Name (e.g., John Smith, Sarah Johnson)
- Department (Computer Science, Mechanical Engineering, Physics, Biology, Chemistry)
- Email addresses
- Academic year information

### Equipment Items:
- **Electronics**: Dell Laptops, USB Hubs, Power Adapters
- **Mechanical**: 3D Printer Filaments, Digital Calipers, Engineering Calculators  
- **Physics**: Oscilloscopes, Function Generators, Multimeters
- **Biology**: Microscopes, Slide Sets, Petri Dishes
- **Chemistry**: Analytical Balances, pH Meters, Beaker Sets

### Financial Data:
- Unit values ranging from $2.00 to $3,200.00
- Total invoice values from $330.00 to $2,580.00
- Quantity information
- Due dates and return schedules

## How to Test OCR Functionality

1. **Access the Invoice & Billing System**:
   - Navigate to the Invoice & Billing section
   - Click the floating SpeedDial button (bottom right)

2. **Upload for OCR Processing**:
   - Select the document/camera icon for "Upload & Extract"
   - Choose any of the sample files from this directory
   - The system will process the image/PDF and extract text

3. **Expected OCR Results**:
   - Student information should be automatically extracted
   - Equipment items with SKUs and values should be detected
   - Invoice numbers and dates should be parsed
   - System will show confidence scores for extracted data

4. **Best Files for Testing**:
   - **Start with**: `sample_invoice_simple.png` (optimized for OCR)
   - **Try PDF processing**: `sample_invoice_001.pdf`
   - **Test image formats**: Both PNG and JPG versions

## Testing Scenarios

### Scenario 1: Perfect OCR
Use `sample_invoice_simple.png` - clean, simple layout should extract perfectly.

### Scenario 2: Complex Layout
Use `sample_invoice_001.pdf` - complex table structure tests advanced parsing.

### Scenario 3: Image Quality
Compare `sample_invoice_004.png` vs `sample_invoice_004.jpg` for format differences.

### Scenario 4: Different Departments
Test with invoices from different departments to verify data variety handling.

## Expected OCR Extraction Fields

The OCR system should attempt to extract:
- **Invoice Number** (INV-2025-XXX format)
- **Student ID** (STU##### format)  
- **Student Name**
- **Department**
- **Email Address**
- **Equipment Items** with SKUs and values
- **Due Dates**
- **Total Values**

## Troubleshooting OCR

If OCR results are poor:
1. Start with `sample_invoice_simple.png` (highest success rate)
2. Check that Tesseract OCR is properly installed on backend
3. Verify image upload is working correctly
4. Review console logs for OCR processing errors

## File Generation

These files were created using:
- **PDFs**: ReportLab library with professional formatting
- **Images**: Pillow (PIL) library with clean typography
- **Data**: Realistic university equipment lending scenarios

All sample data is fictional and created specifically for testing purposes.
