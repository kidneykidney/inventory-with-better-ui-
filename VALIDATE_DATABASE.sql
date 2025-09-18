-- ===================================================================
-- DATABASE VALIDATION SCRIPT
-- ===================================================================
-- Run this script to verify the database setup is complete and working
-- Usage: psql -U postgres -d inventory_management -f VALIDATE_DATABASE.sql
-- ===================================================================

\echo '🔍 Database Validation Starting...'
\echo '=================================='

-- Check if we're connected to the right database
SELECT current_database() as current_database;

\echo ''
\echo '📋 Checking Tables...'

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

\echo ''
\echo '📊 Checking Table Record Counts...'

-- Count records in each table
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL  
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

\echo ''
\echo '⚡ Testing Functions...'

-- Test utility functions
SELECT 'generate_student_id()' as function_name, generate_student_id() as result
UNION ALL
SELECT 'generate_invoice_number()', generate_invoice_number();

\echo ''
\echo '🔍 Checking Indexes...'

-- Check if indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '👀 Checking Views...'

-- Check if views exist
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public';

\echo ''
\echo '🔧 Testing View Data...'

-- Test the invoice_details view
SELECT 
    COUNT(*) as invoice_records,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(DISTINCT invoice_type) as invoice_types
FROM invoice_details;

\echo ''
\echo '⚙️ Checking Settings...'

-- Check system settings
SELECT 
    category,
    key,
    value,
    description
FROM system_settings
ORDER BY category, key;

\echo ''
\echo '👥 Checking Sample Data...'

-- Check sample students
SELECT 
    student_id,
    name,
    department,
    year_of_study
FROM students
ORDER BY student_id;

-- Check sample products
SELECT 
    name,
    sku,
    category_id,
    quantity,
    unit_value
FROM products
ORDER BY id;

\echo ''
\echo '🔐 Checking User Accounts...'

-- Check users (without password hashes)
SELECT 
    username,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM users;

\echo ''
\echo '🧪 Testing Constraints...'

-- Test student ID generation constraint
\echo 'Testing student ID uniqueness...'
DO $$
DECLARE
    new_id1 TEXT;
    new_id2 TEXT;
BEGIN
    SELECT generate_student_id() INTO new_id1;
    SELECT generate_student_id() INTO new_id2;
    
    IF new_id1 != new_id2 THEN
        RAISE NOTICE '✅ Student ID generation working correctly: % vs %', new_id1, new_id2;
    ELSE
        RAISE NOTICE '❌ Student ID generation may have issues: both returned %', new_id1;
    END IF;
END $$;

-- Test invoice number generation
\echo 'Testing invoice number generation...'
DO $$
DECLARE
    new_invoice1 TEXT;
    new_invoice2 TEXT;
BEGIN
    SELECT generate_invoice_number() INTO new_invoice1;
    SELECT generate_invoice_number() INTO new_invoice2;
    
    IF new_invoice1 != new_invoice2 THEN
        RAISE NOTICE '✅ Invoice number generation working correctly: % vs %', new_invoice1, new_invoice2;
    ELSE
        RAISE NOTICE '❌ Invoice number generation may have issues: both returned %', new_invoice1;
    END IF;
END $$;

\echo ''
\echo '🎯 Validation Summary'
\echo '===================='

-- Final validation summary
DO $$
DECLARE
    table_count INTEGER;
    student_count INTEGER;
    product_count INTEGER;
    category_count INTEGER;
    user_count INTEGER;
    setting_count INTEGER;
BEGIN
    -- Count core tables
    SELECT COUNT(*) INTO table_count 
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    -- Count sample data
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO category_count FROM categories;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO setting_count FROM system_settings;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Validation Results:';
    RAISE NOTICE '   Tables created: % (expected: 15+)', table_count;
    RAISE NOTICE '   Sample students: % (expected: 4)', student_count;
    RAISE NOTICE '   Sample products: % (expected: 5)', product_count;
    RAISE NOTICE '   Categories: % (expected: 6)', category_count;
    RAISE NOTICE '   System users: % (expected: 1+)', user_count;
    RAISE NOTICE '   Settings: % (expected: 5+)', setting_count;
    RAISE NOTICE '';
    
    -- Overall validation
    IF table_count >= 15 AND student_count >= 4 AND product_count >= 5 THEN
        RAISE NOTICE '🎉 DATABASE VALIDATION PASSED!';
        RAISE NOTICE '✅ Your database is properly set up and ready to use.';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Next steps:';
        RAISE NOTICE '   1. Update backend/database_manager.py connection settings';
        RAISE NOTICE '   2. Install Python dependencies: pip install -r backend/requirements.txt';
        RAISE NOTICE '   3. Install Node dependencies: npm install';
        RAISE NOTICE '   4. Start backend: python backend/main.py';
        RAISE NOTICE '   5. Start frontend: npm start';
        RAISE NOTICE '   6. Visit: http://localhost:3000';
    ELSE
        RAISE NOTICE '❌ DATABASE VALIDATION FAILED!';
        RAISE NOTICE '⚠️  Some components are missing. Please run MASTER_DATABASE_SETUP.sql';
    END IF;
END $$;

\echo ''
\echo '📝 Validation completed!'
\echo 'If you see "DATABASE VALIDATION PASSED" above, you''re ready to go!'
\echo 'If not, please run: psql -U postgres -f MASTER_DATABASE_SETUP.sql'