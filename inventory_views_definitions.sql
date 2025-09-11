 schemaname |    viewname     |                                       definition                                        
------------+-----------------+-----------------------------------------------------------------------------------------
 public     | invoice_details |  SELECT i.id,                                                                          +
            |                 |     i.invoice_number,                                                                  +
            |                 |     i.invoice_type,                                                                    +
            |                 |     i.status,                                                                          +
            |                 |     i.issue_date,                                                                      +
            |                 |     i.due_date,                                                                        +
            |                 |     i.acknowledgment_date,                                                             +
            |                 |     i.total_items,                                                                     +
            |                 |     i.total_value,                                                                     +
            |                 |     i.has_physical_copy,                                                               +
            |                 |     i.physical_invoice_captured,                                                       +
            |                 |     i.physical_invoice_image_url,                                                      +
            |                 |     o.order_number,                                                                    +
            |                 |     o.status AS order_status,                                                          +
            |                 |     o.requested_date,                                                                  +
            |                 |     o.expected_return_date,                                                            +
            |                 |     s.name AS student_name,                                                            +
            |                 |     s.student_id,                                                                      +
            |                 |     s.email AS student_email,                                                          +
            |                 |     s.department,                                                                      +
            |                 |     s.year_of_study,                                                                   +
            |                 |     ( SELECT count(*) AS count                                                         +
            |                 |            FROM invoice_items ii                                                       +
            |                 |           WHERE (ii.invoice_id = i.id)) AS item_count,                                 +
            |                 |     ( SELECT count(*) AS count                                                         +
            |                 |            FROM invoice_images img                                                     +
            |                 |           WHERE (img.invoice_id = i.id)) AS image_count,                               +
            |                 |     ( SELECT count(*) AS count                                                         +
            |                 |            FROM student_acknowledgments sa                                             +
            |                 |           WHERE (sa.invoice_id = i.id)) AS acknowledgment_count,                       +
            |                 |     ( SELECT sa.acknowledged_at                                                        +
            |                 |            FROM student_acknowledgments sa                                             +
            |                 |           WHERE (sa.invoice_id = i.id)                                                 +
            |                 |           ORDER BY sa.acknowledged_at DESC                                             +
            |                 |          LIMIT 1) AS latest_acknowledgment,                                            +
            |                 |     i.created_at,                                                                      +
            |                 |     i.updated_at                                                                       +
            |                 |    FROM ((invoices i                                                                   +
            |                 |      LEFT JOIN orders o ON ((i.order_id = o.id)))                                      +
            |                 |      LEFT JOIN students s ON ((i.student_id = s.id)));
 public     | students_clean  |  SELECT id,                                                                            +
            |                 |     student_id,                                                                        +
            |                 |     name,                                                                              +
            |                 |     email,                                                                             +
            |                 |     phone,                                                                             +
            |                 |     department,                                                                        +
            |                 |     year_of_study,                                                                     +
            |                 |     course,                                                                            +
            |                 |     is_active,                                                                         +
            |                 |     created_at,                                                                        +
            |                 |     updated_at,                                                                        +
            |                 |     row_number() OVER (PARTITION BY student_id ORDER BY created_at) AS student_id_rank,+
            |                 |     row_number() OVER (PARTITION BY email ORDER BY created_at) AS email_rank           +
            |                 |    FROM students                                                                       +
            |                 |   WHERE (is_active = true);
 public     | students_unique |  SELECT id,                                                                            +
            |                 |     student_id,                                                                        +
            |                 |     name,                                                                              +
            |                 |     email,                                                                             +
            |                 |     phone,                                                                             +
            |                 |     department,                                                                        +
            |                 |     year_of_study,                                                                     +
            |                 |     course,                                                                            +
            |                 |     is_active,                                                                         +
            |                 |     created_at,                                                                        +
            |                 |     updated_at,                                                                        +
            |                 |     student_id_rank,                                                                   +
            |                 |     email_rank                                                                         +
            |                 |    FROM students_clean                                                                 +
            |                 |   WHERE ((student_id_rank = 1) AND (email_rank = 1));
(3 rows)

