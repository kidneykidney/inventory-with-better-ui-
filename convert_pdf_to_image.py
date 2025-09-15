#!/usr/bin/env python3
"""
PDF to Image Converter
Converts the lending invoice PDF to a high-quality image
"""

import sys
from pathlib import Path

def convert_pdf_to_image():
    try:
        # Try using pdf2image first (best quality)
        from pdf2image import convert_from_path
        import os
        
        pdf_path = "Lending_Invoice_LA-2025-001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print("🔄 Converting PDF to high-quality image...")
        
        # Convert PDF to images (one page = one image)
        images = convert_from_path(
            pdf_path, 
            dpi=300,  # High quality
            fmt='PNG'
        )
        
        # Save the first page as PNG
        if images:
            output_path = "Lending_Invoice_LA-2025-001.png"
            images[0].save(output_path, 'PNG', quality=95)
            
            print(f"✅ Successfully converted PDF to image!")
            print(f"📁 Image saved as: {output_path}")
            print(f"📏 Image dimensions: {images[0].size}")
            print(f"🎨 Format: High-quality PNG (300 DPI)")
            
            return True
        else:
            print("❌ No pages found in PDF")
            return False
            
    except ImportError:
        print("📦 pdf2image not found, trying alternative method...")
        return convert_with_reportlab()
    except Exception as e:
        print(f"❌ Error with pdf2image: {e}")
        return convert_with_reportlab()

def convert_with_reportlab():
    """Alternative method using PIL and fitz (PyMuPDF)"""
    try:
        import fitz  # PyMuPDF
        import os
        
        pdf_path = "Lending_Invoice_LA-2025-001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print("🔄 Converting PDF to image using PyMuPDF...")
        
        # Open PDF
        doc = fitz.open(pdf_path)
        
        # Get first page
        page = doc[0]
        
        # Convert to image with high DPI
        mat = fitz.Matrix(3.0, 3.0)  # 3x zoom = ~300 DPI
        pix = page.get_pixmap(matrix=mat)
        
        # Save as PNG
        output_path = "Lending_Invoice_LA-2025-001.png"
        pix.save(output_path)
        
        print(f"✅ Successfully converted PDF to image!")
        print(f"📁 Image saved as: {output_path}")
        print(f"📏 Image dimensions: {pix.width}x{pix.height}")
        print(f"🎨 Format: High-quality PNG")
        
        doc.close()
        return True
        
    except ImportError:
        print("📦 PyMuPDF not found, trying basic conversion...")
        return convert_with_basic_method()
    except Exception as e:
        print(f"❌ Error with PyMuPDF: {e}")
        return convert_with_basic_method()

def convert_with_basic_method():
    """Basic conversion using Pillow and Wand"""
    try:
        from wand.image import Image as WandImage
        import os
        
        pdf_path = "Lending_Invoice_LA-2025-001.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ PDF file not found: {pdf_path}")
            return False
            
        print("🔄 Converting PDF to image using Wand...")
        
        with WandImage(filename=f"{pdf_path}[0]", resolution=300) as img:
            img.format = 'png'
            output_path = "Lending_Invoice_LA-2025-001.png"
            img.save(filename=output_path)
            
            print(f"✅ Successfully converted PDF to image!")
            print(f"📁 Image saved as: {output_path}")
            print(f"📏 Image dimensions: {img.width}x{img.height}")
            print(f"🎨 Format: High-quality PNG (300 DPI)")
            
            return True
            
    except ImportError as e:
        print(f"❌ Required libraries not available: {e}")
        print("\n🛠️  To install required packages, run:")
        print("pip install pdf2image")
        print("pip install PyMuPDF")
        print("pip install Wand")
        return False
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        return False

if __name__ == "__main__":
    print("🖼️  PDF to Image Converter")
    print("=" * 50)
    
    success = convert_pdf_to_image()
    
    if success:
        print("\n🎉 Conversion completed successfully!")
        print("📋 You can now use this image to:")
        print("   🔍 View the invoice visually")
        print("   📱 Share on mobile devices")
        print("   🖼️  Display in presentations")
        print("   📷 Test OCR functionality")
    else:
        print("\n❌ Conversion failed. Please install required packages.")
        sys.exit(1)