-- Email notifications tracking table
CREATE TABLE IF NOT EXISTS email_notifications (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    admin_email VARCHAR(255),
    student_sent BOOLEAN DEFAULT FALSE,
    admin_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    errors TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id ON email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);