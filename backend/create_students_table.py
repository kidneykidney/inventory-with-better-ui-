from database_manager import get_db

try:
    db = get_db()
    
    # Create students table with UUID support to match the API
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(36) PRIMARY KEY,  -- UUID as string
        student_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(100),
        year_of_study INTEGER,
        course VARCHAR(100),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    print("Creating students table...")
    db.execute_query(create_table_sql)
    print("✅ Students table created successfully!")
    
    # Verify the table was created
    result = db.execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position")
    if result:
        print("\nStudents table structure:")
        for col in result:
            print(f"  {col[0]}: {col[1]}")
    else:
        print("❌ Failed to create students table")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()