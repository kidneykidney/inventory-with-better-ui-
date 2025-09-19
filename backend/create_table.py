from database_manager import DatabaseManager

try:
    db = DatabaseManager()
    db.connect()
    
    # Create students table
    create_sql = """
    CREATE TABLE IF NOT EXISTS students (
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
    
    print("Creating students table...")
    db.execute_command(create_sql)
    print("✅ Students table created successfully!")
    
    # Test the table exists by selecting from it
    result = db.execute_query("SELECT COUNT(*) as count FROM students")
    print(f"✅ Table is working. Current record count: {result[0]['count']}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.disconnect()