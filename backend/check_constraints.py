#!/usr/bin/env python3

import psycopg2
from psycopg2.extras import RealDictCursor

def check_database_constraints():
    try:
        # Connect to database
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres',
            password='gugan@2022',
            port=5432
        )
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=== STUDENTS TABLE CONSTRAINTS ===")
        cursor.execute("""
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'students'
        """)
        constraints = cursor.fetchall()
        for constraint in constraints:
            print(f"{constraint['constraint_name']}: {constraint['constraint_type']}")
        
        print("\n=== STUDENTS TABLE UNIQUE CONSTRAINTS DETAILS ===")
        cursor.execute("""
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'students' 
            AND tc.constraint_type = 'UNIQUE'
        """)
        unique_constraints = cursor.fetchall()
        for uc in unique_constraints:
            print(f"Unique constraint '{uc['constraint_name']}' on column: {uc['column_name']}")
        
        print("\n=== STUDENTS TABLE STRUCTURE ===")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'students'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        for col in columns:
            print(f"{col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']}, default: {col['column_default']})")
        
        print("\n=== SAMPLE STUDENTS DATA ===")
        cursor.execute("SELECT student_id, name, email FROM students LIMIT 5")
        students = cursor.fetchall()
        for student in students:
            print(f"ID: {student['student_id']}, Name: {student['name']}, Email: {student['email']}")
        
        print("\n=== CHECKING FOR DUPLICATE STUDENT IDs ===")
        cursor.execute("""
            SELECT student_id, COUNT(*) as count 
            FROM students 
            GROUP BY student_id 
            HAVING COUNT(*) > 1
        """)
        duplicates = cursor.fetchall()
        if duplicates:
            print("Found duplicate student IDs:")
            for dup in duplicates:
                print(f"Student ID '{dup['student_id']}' appears {dup['count']} times")
        else:
            print("No duplicate student IDs found")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_database_constraints()
