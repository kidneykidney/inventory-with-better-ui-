-- MANUAL INSERT: Add the subadmin user to PostgreSQL
-- This adds the user you created in the frontend to the actual database

-- First, let's see what's currently in the table
SELECT * FROM users;

-- Insert the admin user (if not exists)
INSERT INTO users (username, email, role) 
VALUES ('admin', 'admin@college.edu', 'main_admin')
ON CONFLICT (username) DO NOTHING;

-- Insert the subadmin user (based on your frontend screenshot)
INSERT INTO users (username, email, role) 
VALUES ('gugi', 'guganasir@gmail.com', 'sub_admin')
ON CONFLICT (username) DO NOTHING;

-- Verify the insert
SELECT * FROM users WHERE role LIKE '%admin%';
