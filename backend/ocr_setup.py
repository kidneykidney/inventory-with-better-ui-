#!/usr/bin/env python3
"""
OCR Setup and Testing Script
This script helps set up and test OCR functionality for the invoice system
"""
import os
import sys
import subprocess
from pathlib import Path

def check_tesseract_installation():
    """Check if Tesseract is installed and accessible"""
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\{}\AppData\Local\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME')),
        "tesseract.exe",  # If in PATH
    ]
    
    print("🔍 Checking for Tesseract installation...")
    
    for path in possible_paths:
        if Path(path).exists():
            print(f"✅ Found Tesseract at: {path}")
            return path
        else:
            print(f"❌ Not found at: {path}")
    
    # Try to find tesseract using 'where' command
    try:
        result = subprocess.run(['where', 'tesseract'], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            path = result.stdout.strip().split('\n')[0]
            print(f"✅ Found Tesseract in PATH: {path}")
            return path
    except Exception as e:
        print(f"❌ Error searching PATH: {e}")
    
    print("❌ Tesseract not found!")
    return None

def test_python_libraries():
    """Test if Python OCR libraries are working"""
    print("\n🐍 Testing Python OCR libraries...")
    
    # Test PIL/Pillow
    try:
        from PIL import Image
        print("✅ Pillow (PIL) is working")
    except ImportError as e:
        print(f"❌ Pillow not available: {e}")
        return False
    
    # Test pytesseract
    try:
        import pytesseract
        print("✅ pytesseract is imported")
    except ImportError as e:
        print(f"❌ pytesseract not available: {e}")
        return False
    
    # Test OpenCV (optional)
    try:
        import cv2
        print("✅ OpenCV is working")
    except ImportError as e:
        print(f"⚠️  OpenCV not available (optional): {e}")
    
    # Test numpy
    try:
        import numpy as np
        print("✅ NumPy is working")
    except ImportError as e:
        print(f"❌ NumPy not available: {e}")
        return False
    
    return True

def configure_tesseract(tesseract_path):
    """Configure pytesseract with the correct path"""
    print(f"\n⚙️  Configuring pytesseract to use: {tesseract_path}")
    
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # Test basic functionality
        from PIL import Image
        import numpy as np
        
        # Create a simple test image with text
        test_image = Image.new('RGB', (200, 50), color='white')
        
        # Try to extract text (should not crash even with empty image)
        try:
            version = pytesseract.get_tesseract_version()
            print(f"✅ Tesseract version: {version}")
            
            # Test text extraction with a simple image
            text = pytesseract.image_to_string(test_image)
            print("✅ Text extraction test passed")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing Tesseract: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Error importing libraries: {e}")
        return False

def download_tesseract_info():
    """Provide information on how to download Tesseract"""
    print("\n📥 How to install Tesseract OCR:")
    print("1. Visit: https://github.com/UB-Mannheim/tesseract/wiki")
    print("2. Download: tesseract-ocr-w64-setup-5.x.x.exe (latest version)")
    print("3. Run as Administrator")
    print("4. Install to: C:\\Program Files\\Tesseract-OCR")
    print("5. Make sure 'Add to PATH' is checked")
    print("\nAlternatively, if you have chocolatey:")
    print("   choco install tesseract")
    print("\nOr with winget:")
    print("   winget install --id UB-Mannheim.TesseractOCR")

def main():
    """Main setup function"""
    print("🔧 OCR Setup and Testing Tool")
    print("=" * 40)
    
    # Check if Python libraries are installed
    if not test_python_libraries():
        print("\n❌ Python libraries are missing. Please install them:")
        print("   pip install Pillow pytesseract opencv-python numpy")
        return False
    
    # Check for Tesseract
    tesseract_path = check_tesseract_installation()
    
    if tesseract_path:
        if configure_tesseract(tesseract_path):
            print("\n🎉 OCR setup completed successfully!")
            print("Your invoice OCR functionality should now work.")
            return True
        else:
            print("\n❌ OCR configuration failed.")
            return False
    else:
        print("\n❌ Tesseract OCR engine not found.")
        download_tesseract_info()
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ You can now restart your backend server to use OCR features!")
    else:
        print("\n⚠️  Please install missing components and run this script again.")
