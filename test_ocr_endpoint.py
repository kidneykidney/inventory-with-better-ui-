#!/usr/bin/env python3
"""
Simple test script to check OCR endpoint
"""
import requests
import json

def test_ocr_endpoint():
    """Test the OCR endpoint with a sample image"""
    url = "http://localhost:8000/api/invoices/ocr-upload"
    
    # Check if sample image exists
    image_path = "sample_invoice_sarah_johnson.png"
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path, f, 'image/png')}
            
            print(f"Testing OCR endpoint with {image_path}...")
            response = requests.post(url, files=files)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response JSON:")
                print(json.dumps(result, indent=2))
                
                if result.get('success'):
                    print(f"\n✅ OCR Success!")
                    print(f"Confidence: {result.get('confidence_score', 0):.2%}")
                    print(f"Student Name: {result.get('extracted_data', {}).get('student_name', 'N/A')}")
                    print(f"Student ID: {result.get('extracted_data', {}).get('student_id', 'N/A')}")
                    print(f"Department: {result.get('extracted_data', {}).get('department', 'N/A')}")
                else:
                    print(f"\n❌ OCR Failed!")
                    print(f"Error: {result.get('error', 'Unknown error')}")
            else:
                print(f"❌ HTTP Error: {response.text}")
                
    except FileNotFoundError:
        print(f"❌ File not found: {image_path}")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Is the server running on localhost:8000?")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_ocr_endpoint()
