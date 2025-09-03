-- Database Initialization for Docker Container
-- Creates the users table and inserts default admin user

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'sub_admin',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, full_name, role, status, is_active) 
VALUES (
    'admin',
    'admin@college.edu',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyLWg.5qo9dG2u',  -- Hash for 'College@2025'
    'System Administrator',
    'main_admin',
    'active',
    true
) ON CONFLICT (username) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Verify installation
SELECT 'Database initialized successfully!' as message;
SELECT COUNT(*) as admin_users_count FROM users WHERE role LIKE '%admin%';
