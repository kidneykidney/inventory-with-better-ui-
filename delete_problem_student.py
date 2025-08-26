#!/usr/bin/env python3
"""
Debug script to delete the problematic student record
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database_manager import DatabaseManager
    
    db = DatabaseManager()
    
    # Check current students
    print("🔍 Current students with STUD2025001:")
    students = db.execute_query("SELECT id, student_id, name, email FROM students WHERE student_id = 'STUD2025001'")
    
    for student in students:
        print(f"  ID: {student['id']}, Name: {student['name']}, Email: {student['email']}")
        
        # Delete this student record
        print(f"🗑️  Deleting student record ID {student['id']}...")
        delete_result = db.execute_command("DELETE FROM students WHERE id = %s", (student['id'],))
        
        if delete_result:
            print("✅ Student record deleted successfully")
        else:
            print("❌ Failed to delete student record")
    
    if not students:
        print("📋 No student found with ID STUD2025001")
    
    print("\n🔍 Remaining students:")
    all_students = db.execute_query("SELECT student_id, name FROM students ORDER BY created_at DESC LIMIT 5")
    for s in all_students:
        print(f"  {s['student_id']} - {s['name']}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure your database is running")
