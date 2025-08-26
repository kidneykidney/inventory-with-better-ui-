#!/usr/bin/env python3
"""
Test script to verify OCR functionality with text cleaning
"""
import requests
import json
import sys
import os

def test_ocr_api():
    """Test OCR API functionality"""
    try:
        # Test basic API connection
        print("🧪 Testing OCR API Functionality")
        print("=" * 40)
        
        # Check if API is running
        try:
            response = requests.get("http://localhost:8001/health", timeout=5)
            if response.status_code == 200:
                print("✅ API is running on port 8001")
            else:
                print(f"⚠️  API responded with status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ API connection failed: {e}")
            return False
        
        # Test OCR endpoint
        print("\n🔍 Testing OCR endpoints...")
        
        # Check OCR endpoints exist
        try:
            response = requests.get("http://localhost:8001/docs", timeout=5)
            if response.status_code == 200:
                print("✅ API documentation accessible")
            else:
                print("⚠️  API docs not accessible")
        except:
            print("⚠️  Could not access API docs")
        
        # Test text cleaning function (if we can import it)
        print("\n🧹 Testing text cleaning function...")
        
        try:
            # Try to import from backend
            sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
            from invoice_api import clean_extracted_text
            
            # Test with sample data
            test_data = {
                'student_name': '  Sarah   Johnson  ',
                'student_email': 'SARAH.JOHNSON@EMAIL.COM  ',
                'phone': '  123-456-7890  ',
                'some_field': None
            }
            
            cleaned_data = clean_extracted_text(test_data)
            
            print("🧪 Test input:", test_data)
            print("✨ Cleaned output:", cleaned_data)
            
            # Verify cleaning worked
            if cleaned_data.get('student_name') == 'Sarah Johnson':
                print("✅ Name cleaning works correctly")
            else:
                print(f"❌ Name cleaning failed: got '{cleaned_data.get('student_name')}'")
                
            if cleaned_data.get('student_email') == 'sarah.johnson@email.com':
                print("✅ Email cleaning works correctly")
            else:
                print(f"❌ Email cleaning failed: got '{cleaned_data.get('student_email')}'")
                
        except ImportError as e:
            print(f"⚠️  Could not import text cleaning function: {e}")
        except Exception as e:
            print(f"❌ Text cleaning test failed: {e}")
        
        print("\n🎯 Manual Test Instructions:")
        print("1. Open browser to http://localhost:3000")
        print("2. Open Browser DevTools (F12)")
        print("3. Go to Console tab")
        print("4. Upload Sarah's invoice image")
        print("5. Look for these console messages:")
        print("   🔄 'Populating manual data from OCR: {student_name: \"Sarah Johnson\"}'")
        print("   📝 'Creating/updating student with data:'")
        print("   ✅'Updated student with fresh OCR data: Sarah Johnson'")
        print("   🎯 'Using final student data: Name=\"Sarah Johnson\"'")
        print("")
        print("6. Verify the invoice shows 'Sarah Johnson' not 'Emma Wilson'")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_ocr_api()
    if success:
        print("\n✅ OCR API test completed")
    else:
        print("\n❌ OCR API test failed")
        sys.exit(1)
