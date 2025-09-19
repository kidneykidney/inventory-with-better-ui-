from database_manager import DatabaseManager

try:
    db = DatabaseManager()
    db.connect()
    
    print("Modifying students table to make department optional...")
    
    # Make department column nullable
    alter_sql = "ALTER TABLE students ALTER COLUMN department DROP NOT NULL"
    
    db.execute_command(alter_sql)
    print("✅ Department column is now optional!")
    
    # Test by inserting a student without department
    import uuid
    test_uuid = str(uuid.uuid4())
    test_sql = """
    INSERT INTO students (id, student_id, name, email, phone, year_of_study, course) 
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    test_params = (test_uuid, "TEST002", "Test Student 2", "test2@example.com", "1111111111", 2, "Engineering")
    
    db.execute_command(test_sql, test_params)
    print("✅ Successfully inserted student without department!")
    
    # Clean up test data
    db.execute_command("DELETE FROM students WHERE student_id IN ('TEST001', 'TEST002')")
    print("✅ Test data cleaned up")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.disconnect()