from database_manager import get_db

try:
    db = get_db()
    
    # Check available tables
    result = db.execute_query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    print("Available tables:")
    for row in result:
        print(f"  - {row[0]}")
    
    # Check if students table exists
    students_check = db.execute_query("SELECT table_name FROM information_schema.tables WHERE table_name = 'students'")
    if students_check:
        print("\nStudents table exists!")
        # Get students table structure
        columns = db.execute_query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position")
        print("Students table structure:")
        for col in columns:
            print(f"  {col[0]}: {col[1]} (nullable: {col[2]})")
    else:
        print("\nStudents table does NOT exist!")
        print("This is the cause of the 500 error - we need to create the students table.")

except Exception as e:
    print(f"Error: {e}")