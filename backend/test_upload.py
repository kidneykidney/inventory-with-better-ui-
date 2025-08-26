#!/usr/bin/env python3
"""
Test script for invoice image upload API
"""
import sys
import os
import requests
import base64
import json
from datetime import datetime

sys.path.append(os.path.dirname(__file__))

API_BASE_URL = "http://localhost:8000"

def test_upload_endpoint():
    """Test the invoice upload endpoint"""
    
    # First, get a list of invoices to find a valid invoice ID
    try:
        response = requests.get(f"{API_BASE_URL}/invoices/")
        if response.status_code == 200:
            invoices = response.json()
            if invoices:
                invoice_id = invoices[0]['id']
                print(f"✓ Found test invoice: {invoice_id}")
            else:
                print("❌ No invoices found for testing")
                return False
        else:
            print(f"❌ Failed to get invoices: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting invoices: {e}")
        return False
    
    # Create a simple test image (base64 encoded 1x1 pixel PNG)
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    # Prepare test payload
    test_payload = {
        "invoice_id": invoice_id,  # This should be ignored by the API
        "image_type": "physical_invoice",
        "image_data": test_image_base64,
        "image_filename": "test_invoice.png",
        "uploaded_by": "test_user",
        "upload_method": "camera",
        "device_info": {
            "userAgent": "TestAgent",
            "screen": {"width": 1920, "height": 1080}
        },
        "capture_timestamp": datetime.now().isoformat(),
        "notes": "Test upload via API"
    }
    
    # Test the upload endpoint
    try:
        response = requests.post(
            f"{API_BASE_URL}/invoices/{invoice_id}/upload-image",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📡 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload successful!")
            print(f"📄 Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            try:
                error_detail = response.json()
                print(f"📄 Error details: {json.dumps(error_detail, indent=2)}")
            except:
                print(f"📄 Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during upload test: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing invoice image upload endpoint...")
    success = test_upload_endpoint()
    if success:
        print("🎉 Test completed successfully!")
    else:
        print("💥 Test failed!")
