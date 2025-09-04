-- Add invoice_id field to orders table for tracking automatically created invoices

-- Add invoice_id column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders(invoice_id);

-- Add comment to document the field
COMMENT ON COLUMN orders.invoice_id IS 'Reference to automatically created invoice when order is approved';

-- Update any existing approved orders without invoices (optional)
-- This query finds approved orders that don't have associated invoices and could be used for backfilling
-- UPDATE orders SET invoice_id = NULL WHERE status = 'approved' AND invoice_id IS NULL;

SELECT 'Invoice ID field added to orders table successfully!' as message;
