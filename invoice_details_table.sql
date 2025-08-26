-- =========================================
-- INVOICE DETAILS TABLE VIEW
-- Simple query to show all invoice information
-- =========================================

SELECT 
    i.invoice_number as "Invoice Number",
    i.invoice_type as "Type",
    s.name as "Student Name",
    s.student_id as "Student ID",
    i.status as "Status",
    i.total_items as "Total Items",
    i.total_value as "Total Value ($)",
    i.issue_date::date as "Issue Date",
    CASE 
        WHEN i.has_physical_copy THEN 'Yes' 
        ELSE 'No' 
    END as "Physical Copy",
    CASE 
        WHEN i.acknowledged_by_student THEN 'Yes' 
        ELSE 'No' 
    END as "Student Acknowledged",
    i.created_at::date as "Created Date",
    i.updated_at::date as "Last Updated"
FROM invoices i
JOIN students s ON i.student_id = s.id
ORDER BY i.created_at DESC;

-- =========================================
-- INVOICE ITEMS DETAILS (Optional - run separately if needed)
-- =========================================

/*
SELECT 
    i.invoice_number as "Invoice Number",
    p.name as "Product Name",
    p.sku as "Product SKU",
    ii.quantity as "Quantity",
    ii.unit_value as "Unit Price ($)",
    ii.total_value as "Total Value ($)",
    ii.created_at::date as "Added Date"
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN products p ON ii.product_id = p.id
ORDER BY i.invoice_number, p.name;
*/

-- =========================================
-- INVOICE IMAGES DETAILS (Optional - run separately if needed)
-- =========================================

/*
SELECT 
    i.invoice_number as "Invoice Number",
    img.image_type as "Image Type",
    img.image_filename as "File Name",
    img.uploaded_by as "Uploaded By",
    img.created_at::date as "Upload Date"
FROM invoice_images img
JOIN invoices i ON img.invoice_id = i.id
ORDER BY i.invoice_number, img.created_at;
*/
