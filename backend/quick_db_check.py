#!/usr/bin/env python3
"""Quick database check"""

from database_manager import DatabaseManager

db = DatabaseManager()

print("🔍 Recent Students:")
students = db.execute_query("SELECT student_id, name, email, created_at FROM students ORDER BY created_at DESC LIMIT 5")
for s in students:
    print(f"  {s['student_id']} - {s['name']} - {s['email']} - {s['created_at']}")

print("\n🔍 Student STUD2025001:")
specific = db.execute_query("SELECT * FROM students WHERE student_id = 'STUD2025001'")
if specific:
    s = specific[0]
    print(f"  ID: {s['id']}")
    print(f"  Student ID: {s['student_id']}")
    print(f"  Name: {s['name']}")
    print(f"  Email: {s['email']}")
    print(f"  Department: {s['department']}")
else:
    print("  Not found")

print("\n🔍 Recent Invoices:")
invoices = db.execute_query("""
    SELECT i.invoice_number, s.name, s.student_id, i.created_at 
    FROM invoices i 
    JOIN students s ON i.student_id = s.id 
    ORDER BY i.created_at DESC LIMIT 3
""")
for inv in invoices:
    print(f"  {inv['invoice_number']} - {inv['name']} ({inv['student_id']}) - {inv['created_at']}")
