-- Enhanced Flexible Students Schema
-- This schema allows more flexibility while maintaining data integrity

-- First, let's see if we can modify the existing table
-- Drop unique constraints to allow duplicates
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_student_id_key;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;

-- Create a more flexible index instead of unique constraint
-- This allows duplicates but still provides fast lookups
CREATE INDEX IF NOT EXISTS idx_students_student_id_flexible ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email_flexible ON students(email);

-- Add a composite unique constraint only if we want to prevent exact duplicates
-- (same student_id AND same email together)
-- ALTER TABLE students ADD CONSTRAINT students_unique_combo UNIQUE (student_id, email);

-- Or if we want to keep student_id unique but allow email duplicates:
-- ALTER TABLE students ADD CONSTRAINT students_student_id_unique UNIQUE (student_id);

-- Add a soft unique constraint using a partial index
-- This allows empty/null values but prevents duplicates of actual values
CREATE UNIQUE INDEX IF NOT EXISTS students_student_id_unique_when_not_empty 
ON students (student_id) 
WHERE student_id IS NOT NULL AND student_id != '';

CREATE UNIQUE INDEX IF NOT EXISTS students_email_unique_when_not_empty 
ON students (email) 
WHERE email IS NOT NULL AND email != '';

-- Update the table to allow more flexible data
-- Make student_id nullable to allow auto-generation
ALTER TABLE students ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN email DROP NOT NULL;

-- Add a function to auto-generate student IDs if none provided
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_id VARCHAR(50);
BEGIN
    -- Only generate if student_id is null or empty
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        -- Get the next student number
        SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 'STUD([0-9]+)') AS INTEGER)), 0) + 1 
        INTO next_number 
        FROM students 
        WHERE student_id ~ '^STUD[0-9]+$';
        
        -- Generate the student ID
        NEW.student_id = 'STUD' || LPAD(next_number::TEXT, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-generating student IDs
DROP TRIGGER IF EXISTS generate_student_id_trigger ON students;
CREATE TRIGGER generate_student_id_trigger 
BEFORE INSERT ON students 
FOR EACH ROW 
EXECUTE FUNCTION generate_student_id();

-- Add some helpful functions for duplicate management
CREATE OR REPLACE FUNCTION find_or_create_student(
    p_student_id VARCHAR(50),
    p_name VARCHAR(200),
    p_email VARCHAR(200),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_department VARCHAR(100) DEFAULT 'Unknown',
    p_year_of_study INTEGER DEFAULT NULL,
    p_course VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    existing_student_uuid UUID;
    new_student_uuid UUID;
BEGIN
    -- First try to find by student_id
    IF p_student_id IS NOT NULL AND p_student_id != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE student_id = p_student_id 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- Then try to find by email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE email = p_email 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- If not found, create new student
    new_student_uuid = uuid_generate_v4();
    
    INSERT INTO students (
        id, student_id, name, email, phone, department, year_of_study, course
    ) VALUES (
        new_student_uuid, p_student_id, p_name, p_email, p_phone, p_department, p_year_of_study, p_course
    );
    
    RETURN new_student_uuid;
END;
$$ language 'plpgsql';

-- Create a view for clean student data
CREATE OR REPLACE VIEW students_clean AS
SELECT 
    id,
    student_id,
    name,
    email,
    phone,
    department,
    year_of_study,
    course,
    is_active,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at) as student_id_rank,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as email_rank
FROM students
WHERE is_active = true;

-- Create a view that shows only the first occurrence of each student_id and email
CREATE OR REPLACE VIEW students_unique AS
SELECT *
FROM students_clean
WHERE student_id_rank = 1 AND email_rank = 1;
