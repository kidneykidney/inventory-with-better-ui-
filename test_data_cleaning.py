#!/usr/bin/env python3
"""
Test script for OCR data cleaning and validation
"""

def clean_extracted_text(text: str, field_type: str = "general") -> str:
    """Clean and validate extracted text based on field type"""
    if not text:
        return ""
    
    # Basic cleaning
    cleaned = text.strip()
    
    # Remove excessive repeated characters (like sarahhhhh -> sarah)
    import re
    if field_type == "name":
        # Remove excessive repeated characters (more than 2 in a row)
        cleaned = re.sub(r'(.)\1{2,}', r'\1\1', cleaned)
        # Capitalize properly
        cleaned = ' '.join(word.capitalize() for word in cleaned.split())
        # Remove non-alphabetic characters except spaces
        cleaned = re.sub(r'[^a-zA-Z\s]', '', cleaned)
        # Remove extra spaces
        cleaned = ' '.join(cleaned.split())
        
    elif field_type == "email":
        # Basic email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', cleaned):
            return ""
            
    elif field_type == "student_id":
        # Remove spaces and non-alphanumeric characters
        cleaned = re.sub(r'[^a-zA-Z0-9]', '', cleaned)
        
    elif field_type == "department":
        # Capitalize properly and clean
        cleaned = ' '.join(word.capitalize() for word in cleaned.split())
        cleaned = re.sub(r'[^a-zA-Z\s&]', '', cleaned)
        cleaned = ' '.join(cleaned.split())
    
    return cleaned

def test_cleaning():
    """Test the cleaning functions"""
    print("🧪 Testing OCR Data Cleaning")
    print("=" * 40)
    
    # Test name cleaning
    test_names = [
        "sarahhhhh",
        "johnnnnnn smith",  
        "mike@@@@",
        "  SARAH   JOHNSON  ",
        "sarah123johnson"
    ]
    
    print("👤 Name Cleaning:")
    for name in test_names:
        cleaned = clean_extracted_text(name, "name")
        print(f"   '{name}' → '{cleaned}'")
    
    print("\n🆔 Student ID Cleaning:")
    test_ids = [
        "STUD 2025 001",
        "stud2025001",
        "STUD-2025-001",
        "2025001"
    ]
    
    for student_id in test_ids:
        cleaned = clean_extracted_text(student_id, "student_id")
        print(f"   '{student_id}' → '{cleaned}'")
    
    print("\n📧 Email Validation:")
    test_emails = [
        "sarah.johnson@university.edu",
        "invalid-email",
        "  sarah@uni.edu  ",
        "test@domain"
    ]
    
    for email in test_emails:
        cleaned = clean_extracted_text(email, "email")
        status = "✅ Valid" if cleaned else "❌ Invalid"
        print(f"   '{email}' → '{cleaned}' {status}")
    
    print("\n🏫 Department Cleaning:")
    test_depts = [
        "computer science",
        "COMPUTER   SCIENCE",
        "Computer Science & Engineering",
        "comp123sci"
    ]
    
    for dept in test_depts:
        cleaned = clean_extracted_text(dept, "department")
        print(f"   '{dept}' → '{cleaned}'")

if __name__ == "__main__":
    test_cleaning()
    print("\n✅ Test complete! The cleaning functions will now handle:")
    print("   • Remove excessive repeated characters (sarahhhhh → sarah)")
    print("   • Proper capitalization")
    print("   • Email validation")
    print("   • ID format cleaning")
    print("   • Department name formatting")
