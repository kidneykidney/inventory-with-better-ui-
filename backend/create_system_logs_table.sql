-- Create system_logs table for audit trail
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type),
    INDEX idx_created_at (created_at)
);

-- Insert initial log entry
INSERT INTO system_logs (log_type, message) 
VALUES ('system_init', 'Automatic overdue notification system initialized');