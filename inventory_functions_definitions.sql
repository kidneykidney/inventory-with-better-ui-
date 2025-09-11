       routine_name       |                                                    routine_definition                                                     
--------------------------+---------------------------------------------------------------------------------------------------------------------------
 uuid_nil                 | uuid_nil
 uuid_ns_dns              | uuid_ns_dns
 uuid_ns_url              | uuid_ns_url
 uuid_ns_oid              | uuid_ns_oid
 uuid_ns_x500             | uuid_ns_x500
 uuid_generate_v1         | uuid_generate_v1
 uuid_generate_v1mc       | uuid_generate_v1mc
 uuid_generate_v3         | uuid_generate_v3
 uuid_generate_v4         | uuid_generate_v4
 uuid_generate_v5         | uuid_generate_v5
 update_updated_at_column |                                                                                                                          +
                          |                 BEGIN                                                                                                    +
                          |                     NEW.updated_at = CURRENT_TIMESTAMP;                                                                  +
                          |                     RETURN NEW;                                                                                          +
                          |                 END;                                                                                                     +
                          |                 
 generate_invoice_number  |                                                                                                                          +
                          | DECLARE                                                                                                                  +
                          |     next_number INTEGER;                                                                                                 +
                          |     prefix TEXT;                                                                                                         +
                          | BEGIN                                                                                                                    +
                          |     -- Determine prefix based on invoice type                                                                            +
                          |     CASE NEW.invoice_type                                                                                                +
                          |         WHEN 'lending' THEN prefix := 'LEN';                                                                             +
                          |         WHEN 'return' THEN prefix := 'RET';                                                                              +
                          |         WHEN 'damage' THEN prefix := 'DAM';                                                                              +
                          |         WHEN 'replacement' THEN prefix := 'REP';                                                                         +
                          |         ELSE prefix := 'INV';                                                                                            +
                          |     END CASE;                                                                                                            +
                          |                                                                                                                          +
                          |     -- Get the next invoice number for this type                                                                         +
                          |     SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1                      +
                          |     INTO next_number                                                                                                     +
                          |     FROM invoices                                                                                                        +
                          |     WHERE invoice_number ~ ('^' || prefix || '[0-9]+$');                                                                 +
                          |                                                                                                                          +
                          |     -- Generate the invoice number                                                                                       +
                          |     NEW.invoice_number = prefix || LPAD(next_number::TEXT, 3, '0');                                                      +
                          |                                                                                                                          +
                          |     RETURN NEW;                                                                                                          +
                          | END;                                                                                                                     +
                          | 
 create_lending_invoice   |                                                                                                                          +
                          | BEGIN                                                                                                                    +
                          |     -- Only create invoice for approved lending orders                                                                   +
                          |     IF NEW.status = 'approved' AND NEW.order_type = 'lending' AND OLD.status = 'pending' THEN                            +
                          |         INSERT INTO invoices (                                                                                           +
                          |             order_id,                                                                                                    +
                          |             student_id,                                                                                                  +
                          |             invoice_type,                                                                                                +
                          |             status,                                                                                                      +
                          |             total_items,                                                                                                 +
                          |             due_date,                                                                                                    +
                          |             issued_by                                                                                                    +
                          |         )                                                                                                                +
                          |         VALUES (                                                                                                         +
                          |             NEW.id,                                                                                                      +
                          |             NEW.student_id,                                                                                              +
                          |             'lending',                                                                                                   +
                          |             'issued',                                                                                                    +
                          |             NEW.total_items,                                                                                             +
                          |             NEW.expected_return_date,                                                                                    +
                          |             NEW.approved_by                                                                                              +
                          |         );                                                                                                               +
                          |                                                                                                                          +
                          |         -- Log the transaction                                                                                           +
                          |         INSERT INTO invoice_transactions (                                                                               +
                          |             invoice_id,                                                                                                  +
                          |             transaction_type,                                                                                            +
                          |             new_status,                                                                                                  +
                          |             performed_by,                                                                                                +
                          |             changes_summary                                                                                              +
                          |         )                                                                                                                +
                          |         SELECT                                                                                                           +
                          |             i.id,                                                                                                        +
                          |             'created',                                                                                                   +
                          |             'issued',                                                                                                    +
                          |             NEW.approved_by,                                                                                             +
                          |             'Auto-generated lending invoice for approved order'                                                          +
                          |         FROM invoices i                                                                                                  +
                          |         WHERE i.order_id = NEW.id;                                                                                       +
                          |     END IF;                                                                                                              +
                          |                                                                                                                          +
                          |     RETURN NEW;                                                                                                          +
                          | END;                                                                                                                     +
                          | 
 update_product_quantity  |                                                                                                                          +
                          |                 BEGIN                                                                                                    +
                          |                     IF TG_OP = 'INSERT' THEN                                                                             +
                          |                         UPDATE products                                                                                  +
                          |                         SET quantity_available = quantity_available - NEW.quantity_approved                              +
                          |                         WHERE id = NEW.product_id;                                                                       +
                          |                                                                                                                          +
                          |                         INSERT INTO product_transactions (                                                               +
                          |                             product_id, transaction_type, quantity_change,                                               +
                          |                             quantity_before, quantity_after, reference_type, reference_id                                +
                          |                         )                                                                                                +
                          |                         SELECT                                                                                           +
                          |                             NEW.product_id, 'stock_out', -NEW.quantity_approved,                                         +
                          |                             p.quantity_available + NEW.quantity_approved,                                                +
                          |                             p.quantity_available,                                                                        +
                          |                             'order', NEW.order_id                                                                        +
                          |                         FROM products p WHERE p.id = NEW.product_id;                                                     +
                          |                                                                                                                          +
                          |                         RETURN NEW;                                                                                      +
                          |                     END IF;                                                                                              +
                          |                                                                                                                          +
                          |                     IF TG_OP = 'UPDATE' THEN                                                                             +
                          |                         IF OLD.quantity_approved != NEW.quantity_approved THEN                                           +
                          |                             UPDATE products                                                                              +
                          |                             SET quantity_available = quantity_available + OLD.quantity_approved - NEW.quantity_approved  +
                          |                             WHERE id = NEW.product_id;                                                                   +
                          |                         END IF;                                                                                          +
                          |                                                                                                                          +
                          |                         IF OLD.quantity_returned != NEW.quantity_returned THEN                                           +
                          |                             UPDATE products                                                                              +
                          |                             SET quantity_available = quantity_available + (NEW.quantity_returned - OLD.quantity_returned)+
                          |                             WHERE id = NEW.product_id;                                                                   +
                          |                         END IF;                                                                                          +
                          |                                                                                                                          +
                          |                         RETURN NEW;                                                                                      +
                          |                     END IF;                                                                                              +
                          |                                                                                                                          +
                          |                     IF TG_OP = 'DELETE' THEN                                                                             +
                          |                         UPDATE products                                                                                  +
                          |                         SET quantity_available = quantity_available + OLD.quantity_approved - OLD.quantity_returned      +
                          |                         WHERE id = OLD.product_id;                                                                       +
                          |                                                                                                                          +
                          |                         RETURN OLD;                                                                                      +
                          |                     END IF;                                                                                              +
                          |                                                                                                                          +
                          |                     RETURN NULL;                                                                                         +
                          |                 END;                                                                                                     +
                          |                 
 generate_student_id      |                                                                                                                          +
                          | DECLARE                                                                                                                  +
                          |     next_number INTEGER;                                                                                                 +
                          |     new_id VARCHAR(50);                                                                                                  +
                          | BEGIN                                                                                                                    +
                          |     -- Only generate if student_id is null or empty                                                                      +
                          |     IF NEW.student_id IS NULL OR NEW.student_id = '' THEN                                                                +
                          |         -- Get the next student number                                                                                   +
                          |         SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 'STUD([0-9]+)') AS INTEGER)), 0) + 1                          +
                          |         INTO next_number                                                                                                 +
                          |         FROM students                                                                                                    +
                          |         WHERE student_id ~ '^STUD[0-9]+$';                                                                               +
                          |                                                                                                                          +
                          |         -- Generate the student ID                                                                                       +
                          |         NEW.student_id = 'STUD' || LPAD(next_number::TEXT, 6, '0');                                                      +
                          |     END IF;                                                                                                              +
                          |                                                                                                                          +
                          |     RETURN NEW;                                                                                                          +
                          | END;                                                                                                                     +
                          | 
 find_or_create_student   |                                                                                                                          +
                          | DECLARE                                                                                                                  +
                          |     existing_student_uuid UUID;                                                                                          +
                          |     new_student_uuid UUID;                                                                                               +
                          | BEGIN                                                                                                                    +
                          |     -- First try to find by student_id                                                                                   +
                          |     IF p_student_id IS NOT NULL AND p_student_id != '' THEN                                                              +
                          |         SELECT id INTO existing_student_uuid                                                                             +
                          |         FROM students                                                                                                    +
                          |         WHERE student_id = p_student_id                                                                                  +
                          |         LIMIT 1;                                                                                                         +
                          |                                                                                                                          +
                          |         IF existing_student_uuid IS NOT NULL THEN                                                                        +
                          |             RETURN existing_student_uuid;                                                                                +
                          |         END IF;                                                                                                          +
                          |     END IF;                                                                                                              +
                          |                                                                                                                          +
                          |     -- Then try to find by email                                                                                         +
                          |     IF p_email IS NOT NULL AND p_email != '' THEN                                                                        +
                          |         SELECT id INTO existing_student_uuid                                                                             +
                          |         FROM students                                                                                                    +
                          |         WHERE email = p_email                                                                                            +
                          |         LIMIT 1;                                                                                                         +
                          |                                                                                                                          +
                          |         IF existing_student_uuid IS NOT NULL THEN                                                                        +
                          |             RETURN existing_student_uuid;                                                                                +
                          |         END IF;                                                                                                          +
                          |     END IF;                                                                                                              +
                          |                                                                                                                          +
                          |     -- If not found, create new student                                                                                  +
                          |     new_student_uuid = uuid_generate_v4();                                                                               +
                          |                                                                                                                          +
                          |     INSERT INTO students (                                                                                               +
                          |         id, student_id, name, email, phone, department, year_of_study, course                                            +
                          |     ) VALUES (                                                                                                           +
                          |         new_student_uuid, p_student_id, p_name, p_email, p_phone, p_department, p_year_of_study, p_course                +
                          |     );                                                                                                                   +
                          |                                                                                                                          +
                          |     RETURN new_student_uuid;                                                                                             +
                          | END;                                                                                                                     +
                          | 
(16 rows)

