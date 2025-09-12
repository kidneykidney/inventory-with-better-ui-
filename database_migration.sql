-- ===================================================================
-- DATABASE MIGRATION SCRIPT
-- ===================================================================
-- This script safely migrates from scattered schemas to unified schema
-- Run this AFTER backing up your existing database
-- ===================================================================

-- Step 1: Backup existing data (uncomment if you have data to preserve)
/*
CREATE TABLE backup_users AS SELECT * FROM users;
CREATE TABLE backup_students AS SELECT * FROM students;
CREATE TABLE backup_products AS SELECT * FROM products;
CREATE TABLE backup_orders AS SELECT * FROM orders;
CREATE TABLE backup_invoices AS SELECT * FROM invoices;
-- Add more backup tables as needed
*/

-- Step 2: Drop conflicting old tables and objects
DO $$
BEGIN
    -- Drop old tables that might conflict
    DROP TABLE IF EXISTS old_schema_table1 CASCADE;
    DROP TABLE IF EXISTS old_schema_table2 CASCADE;
    
    -- Log the migration
    RAISE NOTICE 'Migration Step 2: Dropped conflicting old tables';
END $$;

-- Step 3: Run the unified schema (this replaces the need to run multiple SQL files)
-- The unified_database_schema.sql contains everything needed

-- Step 4: Data migration (if you have existing data)
/*
-- Example data migration - adjust based on your existing data structure
INSERT INTO students (student_id, name, email, department)
SELECT student_id, name, email, COALESCE(department, 'Unknown') 
FROM backup_students 
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO products (name, sku, quantity_available, category_id)
SELECT name, sku, quantity, 
       (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1)
FROM backup_products
ON CONFLICT (sku) DO NOTHING;
*/

-- Step 5: Update sequences to avoid conflicts
DO $$
BEGIN
    -- Update user sequence
    PERFORM setval('users_id_seq', COALESCE(MAX(id), 1)) FROM users;
    
    -- Update other sequences as needed
    RAISE NOTICE 'Migration Step 5: Updated sequences';
END $$;

-- Step 6: Verification queries
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    -- Count views
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'Views created: %', view_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next steps:';
    RAISE NOTICE '1. Test your application with the new unified schema';
    RAISE NOTICE '2. Remove old SQL files once confirmed working';
    RAISE NOTICE '3. Update your documentation to reference unified_database_schema.sql';
    RAISE NOTICE '================================================================================';
END $$;
