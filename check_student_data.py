#!/usr/bin/env python3
"""
Quick script to check student data in database
"""
import psycopg2
import sys
import json
from datetime import datetime

def check_students():
    """Check all students in database"""
    try:
        # Database connection
        conn = psycopg2.connect(
            host="localhost",
            database="inventory_db", 
            user="postgres",
            password="admin123"
        )
        cur = conn.cursor()
        
        print("🔍 Checking Student Data")
        print("=" * 40)
        
        # Get all students
        cur.execute("""
            SELECT id, student_name, student_email, phone, 
                   created_at, updated_at 
            FROM students 
            ORDER BY updated_at DESC
        """)
        
        students = cur.fetchall()
        
        if not students:
            print("📭 No students found in database")
            return
        
        print(f"👥 Found {len(students)} students:")
        print()
        
        for student in students:
            id, name, email, phone, created_at, updated_at = student
            print(f"🆔 ID: {id}")
            print(f"👤 Name: {name}")
            print(f"📧 Email: {email}")
            print(f"📱 Phone: {phone}")
            print(f"📅 Created: {created_at}")
            print(f"🔄 Updated: {updated_at}")
            print("-" * 30)
        
        # Check for Emma Wilson specifically
        cur.execute("""
            SELECT COUNT(*) FROM students 
            WHERE LOWER(student_name) LIKE '%emma%' 
               OR LOWER(student_name) LIKE '%wilson%'
        """)
        
        emma_count = cur.fetchone()[0]
        if emma_count > 0:
            print(f"⚠️  Found {emma_count} students with Emma/Wilson in name")
            
            cur.execute("""
                SELECT id, student_name, student_email 
                FROM students 
                WHERE LOWER(student_name) LIKE '%emma%' 
                   OR LOWER(student_name) LIKE '%wilson%'
            """)
            
            emma_students = cur.fetchall()
            for student in emma_students:
                print(f"   🎯 ID {student[0]}: {student[1]} ({student[2]})")
        else:
            print("✅ No Emma Wilson records found")
        
        # Check for Sarah Johnson
        cur.execute("""
            SELECT COUNT(*) FROM students 
            WHERE LOWER(student_name) LIKE '%sarah%' 
               OR LOWER(student_name) LIKE '%johnson%'
        """)
        
        sarah_count = cur.fetchone()[0]
        if sarah_count > 0:
            print(f"✅ Found {sarah_count} students with Sarah/Johnson in name")
            
            cur.execute("""
                SELECT id, student_name, student_email 
                FROM students 
                WHERE LOWER(student_name) LIKE '%sarah%' 
                   OR LOWER(student_name) LIKE '%johnson%'
            """)
            
            sarah_students = cur.fetchall()
            for student in sarah_students:
                print(f"   👤 ID {student[0]}: {student[1]} ({student[2]})")
        else:
            print("❌ No Sarah Johnson records found")
            
        cur.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Make sure PostgreSQL is running")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = check_students()
    if success:
        print("\n✅ Database check completed successfully")
    else:
        print("\n❌ Database check failed")
        sys.exit(1)
