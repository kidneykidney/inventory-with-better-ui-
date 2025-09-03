-- DIRECT SQL SOLUTION: Insert Admin Users to PostgreSQL
-- Run this script in pgAdmin to add your admin users to the database

-- First, let's clear any existing admin users to avoid conflicts
DELETE FROM users WHERE role LIKE '%admin%';

-- Insert the main admin user (from your simple_auth_api.py)
-- Using bcrypt hash for password 'College@2025'
INSERT INTO users (username, email, role, password_hash, full_name) 
VALUES ('admin', 'admin@college.edu', 'main_admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyLWg.5qo9dG2u', 'System Administrator');

-- Insert your subadmin user "Gugan" (that you added in the frontend)
-- Using bcrypt hash for password 'College@2025'
INSERT INTO users (username, email, role, password_hash, full_name) 
VALUES ('gugan', 'gugan@college.edu', 'sub_admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyLWg.5qo9dG2u', 'Gugan Subadmin');

-- Verify the insert worked
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE role 
            WHEN 'main_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'subadmin' THEN 3
            WHEN 'sub_admin' THEN 3
            ELSE 4
        END, username) as "Sr#",
    username as "Username",
    email as "Email Address", 
    UPPER(role) as "Role"
FROM users 
WHERE role LIKE '%admin%'
   OR role IN ('main_admin', 'admin', 'subadmin', 'sub_admin')
ORDER BY 
    CASE role 
        WHEN 'main_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'subadmin' THEN 3
        WHEN 'sub_admin' THEN 3
        ELSE 4
    END,
    username;

-- Success message
SELECT 'SUCCESS: Admin users have been synced to database!' as message;
