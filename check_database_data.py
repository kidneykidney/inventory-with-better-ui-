#!/usr/bin/env python3
"""
Quick test script to check what's in the database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database_manager import DatabaseManager

def check_students_data():
    """Check what student data exists"""
    print("🔍 Checking Students Database")
    print("=" * 50)
    
    try:
        db = DatabaseManager()
        
        # Get all students
        students_query = "SELECT student_id, name, email, department, is_active FROM students ORDER BY student_id"
        students = db.execute_query(students_query)
        
        if students:
            print(f"📋 Found {len(students)} students:")
            for student in students:
                status = "✅ Active" if student['is_active'] else "❌ Inactive"
                print(f"   ID: {student['student_id']:15} Name: {student['name']:20} Email: {student['email']:30} Dept: {student['department']:15} {status}")
        else:
            print("📋 No students found in database")
        
        print()
        
        # Check specific student ID from your test
        test_student_id = "STUD2025001"
        specific_query = "SELECT * FROM students WHERE student_id = %s"
        specific_result = db.execute_query(specific_query, (test_student_id,))
        
        if specific_result:
            student = specific_result[0]
            print(f"🎯 Student {test_student_id} Details:")
            print(f"   Database ID: {student['id']}")
            print(f"   Student ID:  {student['student_id']}")
            print(f"   Name:        {student['name']}")
            print(f"   Email:       {student['email']}")
            print(f"   Department:  {student['department']}")
            print(f"   Active:      {student['is_active']}")
            print(f"   Created:     {student['created_at']}")
            print(f"   Updated:     {student['updated_at']}")
        else:
            print(f"❌ Student {test_student_id} not found")
            
        print()
        
        # Check recent invoices
        recent_invoices_query = """
        SELECT i.id, i.invoice_number, s.name as student_name, s.student_id, i.status, i.created_at
        FROM invoices i
        JOIN students s ON i.student_id = s.id
        ORDER BY i.created_at DESC
        LIMIT 5
        """
        recent_invoices = db.execute_query(recent_invoices_query)
        
        if recent_invoices:
            print("📄 Recent Invoices:")
            for invoice in recent_invoices:
                print(f"   {invoice['invoice_number']:10} Student: {invoice['student_name']:20} ({invoice['student_id']}) Status: {invoice['status']:10} Created: {invoice['created_at']}")
        else:
            print("📄 No invoices found")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_students_data()
