import sys
sys.path.append('.')

from database_manager import DatabaseManager
import os

# Create database manager instance
db = DatabaseManager()

try:
    # Simple table creation
    sql = """
    CREATE TABLE students (
        id VARCHAR(36) PRIMARY KEY,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(100),
        year_of_study INTEGER,
        course VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    
    print("Creating students table with direct execution...")
    
    # Use the connection directly
    connection = db.get_connection()
    cursor = connection.cursor()
    cursor.execute(sql)
    connection.commit()
    cursor.close()
    
    print("✅ Students table created successfully!")
    
    # Test a simple insert
    test_sql = "INSERT INTO students (id, student_id, name, email) VALUES ('test-123', 'TEST001', 'Test Student', 'test@test.com')"
    cursor = connection.cursor()
    cursor.execute(test_sql)
    connection.commit()
    cursor.close()
    
    print("✅ Test insert successful!")
    
    # Clean up test data
    cursor = connection.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = 'TEST001'")
    connection.commit()
    cursor.close()
    
    print("✅ Table is ready for use!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'connection' in locals():
        connection.close()