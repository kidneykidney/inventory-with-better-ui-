--
-- PostgreSQL database dump
--

\restrict yayU06yJP8kahufxuf630HABLj8g0ymdLpJyjdxtN0sHRb9gRJBz8wegPWr4wRe

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: create_lending_invoice(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_lending_invoice() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only create invoice for approved lending orders
    IF NEW.status = 'approved' AND NEW.order_type = 'lending' AND OLD.status = 'pending' THEN
        INSERT INTO invoices (
            order_id,
            student_id,
            invoice_type,
            status,
            total_items,
            due_date,
            issued_by
        )
        VALUES (
            NEW.id,
            NEW.student_id,
            'lending',
            'issued',
            NEW.total_items,
            NEW.expected_return_date,
            NEW.approved_by
        );
        
        -- Log the transaction
        INSERT INTO invoice_transactions (
            invoice_id,
            transaction_type,
            new_status,
            performed_by,
            changes_summary
        )
        SELECT 
            i.id,
            'created',
            'issued',
            NEW.approved_by,
            'Auto-generated lending invoice for approved order'
        FROM invoices i
        WHERE i.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_lending_invoice() OWNER TO postgres;

--
-- Name: find_or_create_student(character varying, character varying, character varying, character varying, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_or_create_student(p_student_id character varying, p_name character varying, p_email character varying, p_phone character varying DEFAULT NULL::character varying, p_department character varying DEFAULT 'Unknown'::character varying, p_year_of_study integer DEFAULT NULL::integer, p_course character varying DEFAULT NULL::character varying) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    existing_student_uuid UUID;
    new_student_uuid UUID;
BEGIN
    -- First try to find by student_id
    IF p_student_id IS NOT NULL AND p_student_id != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE student_id = p_student_id 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- Then try to find by email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT id INTO existing_student_uuid 
        FROM students 
        WHERE email = p_email 
        LIMIT 1;
        
        IF existing_student_uuid IS NOT NULL THEN
            RETURN existing_student_uuid;
        END IF;
    END IF;
    
    -- If not found, create new student
    new_student_uuid = uuid_generate_v4();
    
    INSERT INTO students (
        id, student_id, name, email, phone, department, year_of_study, course
    ) VALUES (
        new_student_uuid, p_student_id, p_name, p_email, p_phone, p_department, p_year_of_study, p_course
    );
    
    RETURN new_student_uuid;
END;
$$;


ALTER FUNCTION public.find_or_create_student(p_student_id character varying, p_name character varying, p_email character varying, p_phone character varying, p_department character varying, p_year_of_study integer, p_course character varying) OWNER TO postgres;

--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    next_number INTEGER;
    prefix TEXT;
BEGIN
    -- Determine prefix based on invoice type
    CASE NEW.invoice_type
        WHEN 'lending' THEN prefix := 'LEN';
        WHEN 'return' THEN prefix := 'RET';
        WHEN 'damage' THEN prefix := 'DAM';
        WHEN 'replacement' THEN prefix := 'REP';
        ELSE prefix := 'INV';
    END CASE;
    
    -- Get the next invoice number for this type
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1 
    INTO next_number 
    FROM invoices 
    WHERE invoice_number ~ ('^' || prefix || '[0-9]+$');
    
    -- Generate the invoice number
    NEW.invoice_number = prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN NEW;
END;
$_$;


ALTER FUNCTION public.generate_invoice_number() OWNER TO postgres;

--
-- Name: generate_student_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_student_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    next_number INTEGER;
    new_id VARCHAR(50);
BEGIN
    -- Only generate if student_id is null or empty
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        -- Get the next student number
        SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 'STUD([0-9]+)') AS INTEGER)), 0) + 1 
        INTO next_number 
        FROM students 
        WHERE student_id ~ '^STUD[0-9]+$';
        
        -- Generate the student ID
        NEW.student_id = 'STUD' || LPAD(next_number::TEXT, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$_$;


ALTER FUNCTION public.generate_student_id() OWNER TO postgres;

--
-- Name: update_product_quantity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_product_quantity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    IF TG_OP = 'INSERT' THEN
                        UPDATE products 
                        SET quantity_available = quantity_available - NEW.quantity_approved
                        WHERE id = NEW.product_id;
                        
                        INSERT INTO product_transactions (
                            product_id, transaction_type, quantity_change, 
                            quantity_before, quantity_after, reference_type, reference_id
                        )
                        SELECT 
                            NEW.product_id, 'stock_out', -NEW.quantity_approved,
                            p.quantity_available + NEW.quantity_approved,
                            p.quantity_available,
                            'order', NEW.order_id
                        FROM products p WHERE p.id = NEW.product_id;
                        
                        RETURN NEW;
                    END IF;
                    
                    IF TG_OP = 'UPDATE' THEN
                        IF OLD.quantity_approved != NEW.quantity_approved THEN
                            UPDATE products 
                            SET quantity_available = quantity_available + OLD.quantity_approved - NEW.quantity_approved
                            WHERE id = NEW.product_id;
                        END IF;
                        
                        IF OLD.quantity_returned != NEW.quantity_returned THEN
                            UPDATE products 
                            SET quantity_available = quantity_available + (NEW.quantity_returned - OLD.quantity_returned)
                            WHERE id = NEW.product_id;
                        END IF;
                        
                        RETURN NEW;
                    END IF;
                    
                    IF TG_OP = 'DELETE' THEN
                        UPDATE products 
                        SET quantity_available = quantity_available + OLD.quantity_approved - OLD.quantity_returned
                        WHERE id = OLD.product_id;
                        
                        RETURN OLD;
                    END IF;
                    
                    RETURN NULL;
                END;
                $$;


ALTER FUNCTION public.update_product_quantity() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    resource_type character varying(50),
    resource_id character varying(100),
    details jsonb,
    ip_address inet,
    user_agent text,
    success boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: invoice_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    image_type character varying(50) NOT NULL,
    image_url text NOT NULL,
    image_filename character varying(255),
    image_size integer,
    image_format character varying(10),
    uploaded_by character varying(200),
    upload_method character varying(50),
    capture_timestamp timestamp without time zone,
    device_info jsonb,
    processing_status character varying(50) DEFAULT 'pending'::character varying,
    ocr_text text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_images OWNER TO postgres;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    product_id uuid,
    order_item_id uuid,
    product_name character varying(200) NOT NULL,
    product_sku character varying(100) NOT NULL,
    quantity integer NOT NULL,
    unit_value numeric(10,2) DEFAULT 0.00,
    total_value numeric(10,2) DEFAULT 0.00,
    lending_duration_days integer,
    expected_return_date timestamp without time zone,
    actual_return_date timestamp without time zone,
    return_condition character varying(100),
    damage_assessment text,
    damage_fee numeric(10,2) DEFAULT 0.00,
    replacement_needed boolean DEFAULT false,
    replacement_fee numeric(10,2) DEFAULT 0.00,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    order_id uuid,
    student_id uuid,
    invoice_type character varying(50) DEFAULT 'lending'::character varying,
    status character varying(50) DEFAULT 'draft'::character varying,
    total_items integer DEFAULT 0,
    total_value numeric(10,2) DEFAULT 0.00,
    lending_fee numeric(10,2) DEFAULT 0.00,
    damage_fee numeric(10,2) DEFAULT 0.00,
    replacement_fee numeric(10,2) DEFAULT 0.00,
    issue_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    due_date timestamp without time zone,
    acknowledgment_date timestamp without time zone,
    has_physical_copy boolean DEFAULT false,
    physical_invoice_captured boolean DEFAULT false,
    physical_invoice_image_url text,
    physical_invoice_notes text,
    issued_by character varying(200),
    acknowledged_by_student boolean DEFAULT false,
    student_signature_url text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    student_name_override character varying(200),
    student_email_override character varying(200),
    student_department_override character varying(200),
    use_student_override boolean DEFAULT false
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number character varying(50) NOT NULL,
    student_id uuid,
    order_type character varying(50) DEFAULT 'lending'::character varying,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_items integer DEFAULT 0,
    total_value numeric(10,2) DEFAULT 0.00,
    notes text,
    requested_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_date timestamp without time zone,
    completed_date timestamp without time zone,
    expected_return_date timestamp without time zone,
    actual_return_date timestamp without time zone,
    approved_by character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: student_acknowledgments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_acknowledgments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    student_id uuid,
    acknowledgment_type character varying(50) NOT NULL,
    acknowledged_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_method character varying(50),
    signature_image_url text,
    photo_evidence_url text,
    digital_signature_data text,
    acknowledgment_location character varying(200),
    witness_name character varying(200),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_acknowledgments OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id character varying(50),
    name character varying(200) NOT NULL,
    email character varying(200),
    phone character varying(20),
    department character varying(100) NOT NULL,
    year_of_study integer,
    course character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: invoice_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.invoice_details AS
 SELECT i.id,
    i.invoice_number,
    i.invoice_type,
    i.status,
    i.issue_date,
    i.due_date,
    i.acknowledgment_date,
    i.total_items,
    i.total_value,
    i.has_physical_copy,
    i.physical_invoice_captured,
    i.physical_invoice_image_url,
    o.order_number,
    o.status AS order_status,
    o.requested_date,
    o.expected_return_date,
    s.name AS student_name,
    s.student_id,
    s.email AS student_email,
    s.department,
    s.year_of_study,
    ( SELECT count(*) AS count
           FROM public.invoice_items ii
          WHERE (ii.invoice_id = i.id)) AS item_count,
    ( SELECT count(*) AS count
           FROM public.invoice_images img
          WHERE (img.invoice_id = i.id)) AS image_count,
    ( SELECT count(*) AS count
           FROM public.student_acknowledgments sa
          WHERE (sa.invoice_id = i.id)) AS acknowledgment_count,
    ( SELECT sa.acknowledged_at
           FROM public.student_acknowledgments sa
          WHERE (sa.invoice_id = i.id)
          ORDER BY sa.acknowledged_at DESC
         LIMIT 1) AS latest_acknowledgment,
    i.created_at,
    i.updated_at
   FROM ((public.invoices i
     LEFT JOIN public.orders o ON ((i.order_id = o.id)))
     LEFT JOIN public.students s ON ((i.student_id = s.id)));


ALTER VIEW public.invoice_details OWNER TO postgres;

--
-- Name: invoice_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    transaction_type character varying(50) NOT NULL,
    previous_status character varying(50),
    new_status character varying(50),
    performed_by character varying(200),
    changes_summary text,
    change_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_transactions OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity_requested integer NOT NULL,
    quantity_approved integer DEFAULT 0,
    quantity_returned integer DEFAULT 0,
    unit_price numeric(10,2) DEFAULT 0.00,
    total_price numeric(10,2) DEFAULT 0.00,
    is_returnable boolean NOT NULL,
    expected_return_date timestamp without time zone,
    actual_return_date timestamp without time zone,
    return_condition character varying(100),
    notes text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: product_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    transaction_type character varying(50) NOT NULL,
    quantity_change integer NOT NULL,
    quantity_before integer,
    quantity_after integer,
    reference_type character varying(50),
    reference_id uuid,
    notes text,
    created_by character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    performed_by character varying(200)
);


ALTER TABLE public.product_transactions OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category_id uuid,
    sku character varying(100) NOT NULL,
    quantity_available integer DEFAULT 0 NOT NULL,
    quantity_total integer DEFAULT 0 NOT NULL,
    is_returnable boolean DEFAULT true NOT NULL,
    unit_price numeric(10,2) DEFAULT 0.00,
    location character varying(100),
    minimum_stock_level integer DEFAULT 0,
    image_url text,
    specifications jsonb,
    tags text[],
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: students_clean; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.students_clean AS
 SELECT id,
    student_id,
    name,
    email,
    phone,
    department,
    year_of_study,
    course,
    is_active,
    created_at,
    updated_at,
    row_number() OVER (PARTITION BY student_id ORDER BY created_at) AS student_id_rank,
    row_number() OVER (PARTITION BY email ORDER BY created_at) AS email_rank
   FROM public.students
  WHERE (is_active = true);


ALTER VIEW public.students_clean OWNER TO postgres;

--
-- Name: students_unique; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.students_unique AS
 SELECT id,
    student_id,
    name,
    email,
    phone,
    department,
    year_of_study,
    course,
    is_active,
    created_at,
    updated_at,
    student_id_rank,
    email_rank
   FROM public.students_clean
  WHERE ((student_id_rank = 1) AND (email_rank = 1));


ALTER VIEW public.students_unique OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    category character varying(50) NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    data_type character varying(20) DEFAULT 'string'::character varying NOT NULL,
    description text,
    is_sensitive boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    access_token_jti character varying(255) NOT NULL,
    refresh_token_jti character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    refresh_expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    role character varying(20) DEFAULT 'viewer'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, success, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, created_at, updated_at) FROM stdin;
f12bc421-703b-4806-97ad-9ab958c95929	Microcontrollers	Development boards and microcontroller units	2025-08-29 12:24:42.943711	2025-08-29 12:24:42.943711
e7c2105c-9786-4600-b91e-fab9b98d5a51	Sensors	Various sensors for data collection	2025-08-29 12:24:42.943711	2025-08-29 12:24:42.943711
fb6237cb-a72a-487f-a699-39e8199a2710	Tools	Development and debugging tools	2025-08-29 12:24:42.943711	2025-08-29 12:24:42.943711
74eb5d12-a1af-437f-acfc-3ec20a337bc2	Components	Electronic components and parts	2025-08-29 12:24:42.943711	2025-08-29 12:24:42.943711
04e48788-3815-4c79-9364-35d9649cb194	Accessories	Cables, connectors, and accessories	2025-08-29 12:24:42.943711	2025-08-29 12:24:42.943711
\.


--
-- Data for Name: invoice_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_images (id, invoice_id, image_type, image_url, image_filename, image_size, image_format, uploaded_by, upload_method, capture_timestamp, device_info, processing_status, ocr_text, notes, created_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, product_id, order_item_id, product_name, product_sku, quantity, unit_value, total_value, lending_duration_days, expected_return_date, actual_return_date, return_condition, damage_assessment, damage_fee, replacement_needed, replacement_fee, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_transactions (id, invoice_id, transaction_type, previous_status, new_status, performed_by, changes_summary, change_reason, created_at) FROM stdin;
b2e26a39-94c7-4cdd-91df-89c83b9e32f5	7ed5ffb9-629e-4f08-8b89-34208fb32f14	created	\N	issued	Bulk OCR System	Invoice created with auto-student creation for Sarah Johnson\n\nStudent	\N	2025-09-09 14:07:14.96784
31a523f7-3c9f-4f2a-9d4f-8ddbd5334849	6181a6a1-84d7-48b2-8083-006cd8806867	created	\N	issued	Bulk OCR System	Invoice created with auto-student creation for Sarah Johnson\nStudent	\N	2025-09-09 14:07:15.041738
fdd961ac-d7d9-4829-9823-635da346c53c	f972d60f-c695-4ee6-aa59-341e4e614ade	created	\N	issued	Bulk OCR System	Invoice created with auto-student creation for Emma Wilson Department	\N	2025-09-09 14:07:15.098574
8dcad916-aa04-4555-afdd-66511a4f0cc8	072b14d4-9441-418e-91d7-bdec13a8003f	created	\N	issued	\N	Auto-generated lending invoice for approved order	\N	2025-09-09 14:07:51.553442
dc8c59a9-8bef-4540-8eb6-d0909916dbc4	e0a9d419-c0fa-42af-8eb0-7d2fb408e509	created	\N	issued	System	Invoice created with auto-student creation for Emma Wilson Department	\N	2025-09-09 14:08:03.65469
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, order_id, student_id, invoice_type, status, total_items, total_value, lending_fee, damage_fee, replacement_fee, issue_date, due_date, acknowledgment_date, has_physical_copy, physical_invoice_captured, physical_invoice_image_url, physical_invoice_notes, issued_by, acknowledged_by_student, student_signature_url, notes, created_at, updated_at, student_name_override, student_email_override, student_department_override, use_student_override) FROM stdin;
7ed5ffb9-629e-4f08-8b89-34208fb32f14	LEN001	\N	3e3cd049-7451-45f3-a8e5-4de4539534f7	lending	issued	0	0.00	0.00	0.00	0.00	2025-09-09 14:07:14.957091	\N	\N	f	f	\N	\N	Bulk OCR System	f	\N	Bulk uploaded invoice. OCR confidence: 0.95	2025-09-09 14:07:14.957091	2025-09-09 14:07:14.957091	\N	\N	\N	f
6181a6a1-84d7-48b2-8083-006cd8806867	LEN002	\N	3e3cd049-7451-45f3-a8e5-4de4539534f7	lending	issued	0	0.00	0.00	0.00	0.00	2025-09-09 14:07:15.037205	\N	\N	f	f	\N	\N	Bulk OCR System	f	\N	Bulk uploaded invoice. OCR confidence: 0.95	2025-09-09 14:07:15.037205	2025-09-09 14:07:15.037205	\N	\N	\N	f
f972d60f-c695-4ee6-aa59-341e4e614ade	LEN003	\N	0b589bb2-9ce8-448c-bd09-c3eabf0704d9	lending	issued	0	0.00	0.00	0.00	0.00	2025-09-09 14:07:15.094842	\N	\N	f	f	\N	\N	Bulk OCR System	f	\N	Bulk uploaded invoice. OCR confidence: 0.95	2025-09-09 14:07:15.094842	2025-09-09 14:07:15.094842	\N	\N	\N	f
072b14d4-9441-418e-91d7-bdec13a8003f	LEN004	4f4eac59-997c-481f-b05a-851dae070c7d	0b589bb2-9ce8-448c-bd09-c3eabf0704d9	lending	issued	12	0.00	0.00	0.00	0.00	2025-09-09 14:07:51.553442	2025-09-10 00:00:00	\N	f	f	\N	\N	\N	f	\N	\N	2025-09-09 14:07:51.553442	2025-09-09 14:07:51.553442	\N	\N	\N	f
5238336e-c46c-4fc6-8efb-9483c7c049e8	LEN005	4f4eac59-997c-481f-b05a-851dae070c7d	0b589bb2-9ce8-448c-bd09-c3eabf0704d9	lending	issued	12	0.00	0.00	0.00	0.00	2025-09-09 14:08:03.630475	2025-09-10 00:00:00	\N	f	f	\N	\N	System	f	\N	Auto-generated invoice for approved order ORD001	2025-09-09 14:08:03.630475	2025-09-09 14:08:03.630475	\N	\N	\N	f
e0a9d419-c0fa-42af-8eb0-7d2fb408e509	LEN006	\N	0b589bb2-9ce8-448c-bd09-c3eabf0704d9	lending	issued	0	0.00	0.00	0.00	0.00	2025-09-09 14:08:03.652009	2025-09-10 00:00:00	\N	f	f	\N	\N	System	f	\N	Auto-generated invoice for approved order ORD001	2025-09-09 14:08:03.652009	2025-09-09 14:08:03.652009	\N	\N	\N	f
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity_requested, quantity_approved, quantity_returned, unit_price, total_price, is_returnable, expected_return_date, actual_return_date, return_condition, notes, status, created_at, updated_at) FROM stdin;
b54b2673-1cf7-4247-a731-75def1d08cba	4f4eac59-997c-481f-b05a-851dae070c7d	cd13d572-cf33-45c9-be3f-a46cc4dff844	12	12	0	12.00	144.00	t	2025-09-10 00:00:00	\N	\N	\N	approved	2025-09-09 14:07:47.018617	2025-09-09 14:07:51.560569
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, student_id, order_type, status, total_items, total_value, notes, requested_date, approved_date, completed_date, expected_return_date, actual_return_date, approved_by, created_at, updated_at) FROM stdin;
4f4eac59-997c-481f-b05a-851dae070c7d	ORD001	0b589bb2-9ce8-448c-bd09-c3eabf0704d9	lending	approved	12	144.00	\N	2025-09-09 14:07:47.014532	2025-09-09 14:07:51.553442	\N	2025-09-10 00:00:00	\N	\N	2025-09-09 14:07:47.014532	2025-09-09 14:07:51.553442
\.


--
-- Data for Name: product_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_transactions (id, product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by, created_at, performed_by) FROM stdin;
204b3180-8034-4cc9-bdd4-37612e28d346	cd13d572-cf33-45c9-be3f-a46cc4dff844	stock_in	100	0	1000	manual	\N	\N	\N	2025-09-09 14:06:23.317172	system
7045653f-84dd-494e-9932-680d2cd4eada	cd13d572-cf33-45c9-be3f-a46cc4dff844	stock_out	0	1000	1000	order	4f4eac59-997c-481f-b05a-851dae070c7d	\N	\N	2025-09-09 14:07:47.018617	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, category_id, sku, quantity_available, quantity_total, is_returnable, unit_price, location, minimum_stock_level, image_url, specifications, tags, status, created_at, updated_at) FROM stdin;
cd13d572-cf33-45c9-be3f-a46cc4dff844	resistor	\N	74eb5d12-a1af-437f-acfc-3ec20a337bc2	ff	988	100	t	12.00	\N	0	\N	{}	{}	active	2025-09-09 14:06:23.312602	2025-09-09 14:07:51.560569
\.


--
-- Data for Name: student_acknowledgments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_acknowledgments (id, invoice_id, student_id, acknowledgment_type, acknowledged_at, acknowledgment_method, signature_image_url, photo_evidence_url, digital_signature_data, acknowledgment_location, witness_name, notes, created_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, student_id, name, email, phone, department, year_of_study, course, is_active, created_at, updated_at) FROM stdin;
3e3cd049-7451-45f3-a8e5-4de4539534f7	STUD2025001	Sarah Johnson\n\nStudent	stud2025001@student.local	\N	Computer Science	1	\N	t	2025-09-09 14:07:14.948113	2025-09-09 14:07:14.948113
0b589bb2-9ce8-448c-bd09-c3eabf0704d9	STU54321	Emma Wilson Department	stu54321@student.local	\N	Biology	1	\N	t	2025-09-09 14:07:15.092952	2025-09-09 14:07:15.092952
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, category, key, value, data_type, description, is_sensitive, created_at, updated_at) FROM stdin;
11	ocr	tesseract_path	C:\\Program Files\\Tesseract-OCR\\tesseract.exe	string	\N	f	2025-09-01 11:02:03.173728	2025-09-01 11:02:03.173728
12	ocr	confidence_threshold	0.7	float	\N	f	2025-09-01 11:02:03.17415	2025-09-01 11:02:03.17415
13	ocr	processing_timeout	30	int	\N	f	2025-09-01 11:02:03.174598	2025-09-01 11:02:03.174598
14	ocr	max_image_size_mb	10	int	\N	f	2025-09-01 11:02:03.175564	2025-09-01 11:02:03.175564
15	ocr	supported_formats	["jpg", "jpeg", "png", "pdf", "tiff", "bmp"]	list	\N	f	2025-09-01 11:02:03.176034	2025-09-01 11:02:03.176034
16	ocr	ocr_language	eng	string	\N	f	2025-09-01 11:02:03.176499	2025-09-01 11:02:03.176499
17	ocr	enable_preprocessing	True	bool	\N	f	2025-09-01 11:02:03.176913	2025-09-01 11:02:03.176913
18	ocr	fallback_enabled	True	bool	\N	f	2025-09-01 11:02:03.177328	2025-09-01 11:02:03.177328
19	file_upload	max_file_size_mb	10	int	\N	f	2025-09-01 11:02:03.177789	2025-09-01 11:02:03.177789
20	file_upload	upload_directory	uploads	string	\N	f	2025-09-01 11:02:03.178263	2025-09-01 11:02:03.178263
21	file_upload	allowed_image_formats	["jpg", "jpeg", "png", "gif", "bmp", "tiff"]	list	\N	f	2025-09-01 11:02:03.178781	2025-09-01 11:02:03.178781
22	file_upload	allowed_document_formats	["pdf", "doc", "docx", "xls", "xlsx"]	list	\N	f	2025-09-01 11:02:03.179209	2025-09-01 11:02:03.179209
23	file_upload	enable_virus_scan	False	bool	\N	f	2025-09-01 11:02:03.179601	2025-09-01 11:02:03.179601
24	file_upload	compress_images	True	bool	\N	f	2025-09-01 11:02:03.180076	2025-09-01 11:02:03.180076
25	file_upload	generate_thumbnails	True	bool	\N	f	2025-09-01 11:02:03.180701	2025-09-01 11:02:03.180701
26	file_upload	cleanup_temp_files	True	bool	\N	f	2025-09-01 11:02:03.181486	2025-09-01 11:02:03.181486
27	security	enable_cors	True	bool	\N	f	2025-09-01 11:02:03.182934	2025-09-01 11:02:03.182934
28	security	cors_origins	["http://localhost:3000", "http://localhost:8000"]	list	\N	f	2025-09-01 11:02:03.183453	2025-09-01 11:02:03.183453
29	security	api_rate_limit	100	int	\N	f	2025-09-01 11:02:03.183891	2025-09-01 11:02:03.183891
30	security	session_timeout_minutes	60	int	\N	f	2025-09-01 11:02:03.184302	2025-09-01 11:02:03.184302
31	security	require_https	False	bool	\N	f	2025-09-01 11:02:03.184705	2025-09-01 11:02:03.184705
32	security	enable_api_keys	False	bool	\N	t	2025-09-01 11:02:03.185187	2025-09-01 11:02:03.185187
33	security	password_min_length	8	int	\N	t	2025-09-01 11:02:03.185682	2025-09-01 11:02:03.185682
34	security	max_login_attempts	5	int	\N	f	2025-09-01 11:02:03.186134	2025-09-01 11:02:03.186134
35	security	lockout_duration_minutes	15	int	\N	f	2025-09-01 11:02:03.186563	2025-09-01 11:02:03.186563
47	notifications	email_enabled	False	bool	\N	f	2025-09-01 11:02:03.191548	2025-09-01 11:02:03.191548
48	notifications	smtp_server		string	\N	f	2025-09-01 11:02:03.191951	2025-09-01 11:02:03.191951
49	notifications	smtp_port	587	int	\N	f	2025-09-01 11:02:03.19236	2025-09-01 11:02:03.19236
50	notifications	smtp_username		string	\N	f	2025-09-01 11:02:03.192767	2025-09-01 11:02:03.192767
51	notifications	smtp_password		string	\N	t	2025-09-01 11:02:03.193713	2025-09-01 11:02:03.193713
52	notifications	smtp_use_tls	True	bool	\N	f	2025-09-01 11:02:03.194793	2025-09-01 11:02:03.194793
53	notifications	admin_email	admin@university.edu	string	\N	f	2025-09-01 11:02:03.195247	2025-09-01 11:02:03.195247
54	notifications	log_level	INFO	string	\N	f	2025-09-01 11:02:03.195684	2025-09-01 11:02:03.195684
55	notifications	enable_console_logging	True	bool	\N	f	2025-09-01 11:02:03.196104	2025-09-01 11:02:03.196104
56	notifications	enable_file_logging	True	bool	\N	f	2025-09-01 11:02:03.196531	2025-09-01 11:02:03.196531
57	notifications	log_file_path	logs/application.log	string	\N	f	2025-09-01 11:02:03.197094	2025-09-01 11:02:03.197094
58	notifications	log_rotation_days	30	int	\N	f	2025-09-01 11:02:03.19786	2025-09-01 11:02:03.19786
59	business	invoice_number_prefix	INV	string	\N	f	2025-09-01 11:02:03.19863	2025-09-01 11:02:03.19863
60	business	invoice_number_format	{prefix}-{year}-{sequence:04d}	string	\N	f	2025-09-01 11:02:03.20001	2025-09-01 11:02:03.20001
61	business	default_departments	["Computer Science", "Biology", "Chemistry", "Physics", "Engineering", "Mathematics", "Business", "Arts", "Medicine"]	list	\N	f	2025-09-01 11:02:03.200485	2025-09-01 11:02:03.200485
62	business	default_item_categories	["Microscopes", "Laboratory Equipment", "Computer Hardware", "Scientific Instruments", "Audio Visual", "Tools", "Books"]	list	\N	f	2025-09-01 11:02:03.201025	2025-09-01 11:02:03.201025
63	business	default_invoice_type	lending	string	\N	f	2025-09-01 11:02:03.201465	2025-09-01 11:02:03.201465
64	business	auto_generate_barcodes	True	bool	\N	f	2025-09-01 11:02:03.201919	2025-09-01 11:02:03.201919
65	business	require_approval_over_amount	1000.0	float	\N	f	2025-09-01 11:02:03.202409	2025-09-01 11:02:03.202409
66	business	default_loan_duration_days	30	int	\N	f	2025-09-01 11:02:03.203325	2025-09-01 11:02:03.203325
67	business	enable_overdue_alerts	True	bool	\N	f	2025-09-01 11:02:03.203741	2025-09-01 11:02:03.203741
68	performance	enable_caching	True	bool	\N	f	2025-09-01 11:02:03.204158	2025-09-01 11:02:03.204158
69	performance	cache_ttl_seconds	300	int	\N	f	2025-09-01 11:02:03.204566	2025-09-01 11:02:03.204566
70	performance	enable_compression	True	bool	\N	f	2025-09-01 11:02:03.204964	2025-09-01 11:02:03.204964
71	performance	max_batch_size	1000	int	\N	f	2025-09-01 11:02:03.205363	2025-09-01 11:02:03.205363
72	performance	database_pool_size	10	int	\N	f	2025-09-01 11:02:03.20576	2025-09-01 11:02:03.20576
73	performance	api_timeout_seconds	30	int	\N	f	2025-09-01 11:02:03.206173	2025-09-01 11:02:03.206173
74	performance	enable_query_optimization	True	bool	\N	f	2025-09-01 11:02:03.206578	2025-09-01 11:02:03.206578
75	performance	background_task_workers	2	int	\N	f	2025-09-01 11:02:03.206974	2025-09-01 11:02:03.206974
2	database	port	5432	int	\N	f	2025-09-01 11:02:03.168753	2025-09-03 13:43:06.385172
3	database	database	inventory_management	string	\N	f	2025-09-01 11:02:03.169795	2025-09-03 13:43:06.385751
4	database	username	postgres	string	\N	f	2025-09-01 11:02:03.170732	2025-09-03 13:43:06.386348
5	database	password	gugan@2022	string	\N	t	2025-09-01 11:02:03.171207	2025-09-03 13:43:06.386897
6	database	connection_timeout	30	int	\N	f	2025-09-01 11:02:03.171614	2025-09-03 13:43:06.387926
7	database	command_timeout	60	int	\N	f	2025-09-01 11:02:03.172037	2025-09-03 13:43:06.389093
8	database	max_connections	20	int	\N	f	2025-09-01 11:02:03.172445	2025-09-03 13:43:06.390264
9	database	ssl_mode	prefer	string	\N	f	2025-09-01 11:02:03.172849	2025-09-03 13:43:06.390864
10	database	enable_logging	True	bool	\N	f	2025-09-01 11:02:03.173293	2025-09-03 13:43:06.392435
36	application	app_name	Inventory Management System	string	\N	f	2025-09-01 11:02:03.187043	2025-09-04 10:33:32.550156
1	database	host	localhost	string	\N	f	2025-09-01 11:02:03.160369	2025-09-03 13:43:06.384448
37	application	app_version	1.0.0	string	\N	f	2025-09-01 11:02:03.187469	2025-09-04 10:33:32.557172
38	application	company_name	University Equipment Center	string	\N	f	2025-09-01 11:02:03.187887	2025-09-04 10:33:32.5578
39	application	company_email	equipment@university.edu	string	\N	f	2025-09-01 11:02:03.188316	2025-09-04 10:33:32.558285
40	application	company_phone	(555) 123-4567	string	\N	f	2025-09-01 11:02:03.188725	2025-09-04 10:33:32.558747
41	application	default_currency	INR	string	\N	f	2025-09-01 11:02:03.189128	2025-09-04 10:33:32.559251
42	application	date_format	%Y-%m-%d	string	\N	f	2025-09-01 11:02:03.189529	2025-09-04 10:33:32.559791
43	application	time_format	%H:%M:%S	string	\N	f	2025-09-01 11:02:03.189929	2025-09-04 10:33:32.560859
44	application	timezone	UTC	string	\N	f	2025-09-01 11:02:03.190325	2025-09-04 10:33:32.562079
45	application	items_per_page	20	int	\N	f	2025-09-01 11:02:03.190739	2025-09-04 10:33:32.563873
46	application	enable_dark_theme	True	bool	\N	f	2025-09-01 11:02:03.19114	2025-09-04 10:33:32.565016
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, access_token_jti, refresh_token_jti, expires_at, refresh_expires_at, is_active, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, full_name, role, status, is_active, created_at, updated_at) FROM stdin;
31	Gugan K	guganasfr@gmail.com	91e2216f254ee7fa2265f3a998cb2015207c04528ec4142c2eea8ecee005c31c	Gugan 	sub_admin	active	t	2025-09-09 14:09:26.298761	2025-09-09 14:09:26.298761
5	admin	admin@college.edu	19a9efee010bdc16a8b8d756b50038434752cae3af85babc710ca71a0e7f717b	System Administrator	main_admin	active	t	2025-09-02 22:39:48.404235	2025-09-11 09:42:46.880597
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 106, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 31, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: invoice_images invoice_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_images
    ADD CONSTRAINT invoice_images_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_transactions invoice_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_transactions
    ADD CONSTRAINT invoice_transactions_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_transactions product_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_transactions
    ADD CONSTRAINT product_transactions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: student_acknowledgments student_acknowledgments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_category_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_category_key_key UNIQUE (category, key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_access_token_jti_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_access_token_jti_key UNIQUE (access_token_jti);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_jti_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_jti_key UNIQUE (refresh_token_jti);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_invoice_images_image_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_images_image_type ON public.invoice_images USING btree (image_type);


--
-- Name: idx_invoice_images_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_images_invoice_id ON public.invoice_images USING btree (invoice_id);


--
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_product_id ON public.invoice_items USING btree (product_id);


--
-- Name: idx_invoice_transactions_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_transactions_invoice_id ON public.invoice_transactions USING btree (invoice_id);


--
-- Name: idx_invoices_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_issue_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_issue_date ON public.invoices USING btree (issue_date);


--
-- Name: idx_invoices_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_order_id ON public.invoices USING btree (order_id);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_student_id ON public.invoices USING btree (student_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_student_id ON public.orders USING btree (student_id);


--
-- Name: idx_product_transactions_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_transactions_product_id ON public.product_transactions USING btree (product_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_settings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_settings_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settings_key ON public.system_settings USING btree (category, key);


--
-- Name: idx_student_acknowledgments_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_acknowledgments_invoice_id ON public.student_acknowledgments USING btree (invoice_id);


--
-- Name: idx_students_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email ON public.students USING btree (email);


--
-- Name: idx_students_email_flexible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email_flexible ON public.students USING btree (email);


--
-- Name: idx_students_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_student_id ON public.students USING btree (student_id);


--
-- Name: idx_students_student_id_flexible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_student_id_flexible ON public.students USING btree (student_id);


--
-- Name: students_email_unique_when_not_empty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX students_email_unique_when_not_empty ON public.students USING btree (email) WHERE ((email IS NOT NULL) AND ((email)::text <> ''::text));


--
-- Name: students_student_id_unique_when_not_empty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX students_student_id_unique_when_not_empty ON public.students USING btree (student_id) WHERE ((student_id IS NOT NULL) AND ((student_id)::text <> ''::text));


--
-- Name: orders create_lending_invoice_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER create_lending_invoice_trigger AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.create_lending_invoice();


--
-- Name: invoices generate_invoice_number_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (((new.invoice_number IS NULL) OR ((new.invoice_number)::text = ''::text))) EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: students generate_student_id_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_student_id_trigger BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.generate_student_id();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoice_items update_invoice_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_items update_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_items update_product_quantity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_product_quantity_trigger AFTER INSERT OR DELETE OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: invoice_images invoice_images_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_images
    ADD CONSTRAINT invoice_images_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: invoice_transactions invoice_transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_transactions
    ADD CONSTRAINT invoice_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: product_transactions product_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_transactions
    ADD CONSTRAINT product_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: student_acknowledgments student_acknowledgments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: student_acknowledgments student_acknowledgments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yayU06yJP8kahufxuf630HABLj8g0ymdLpJyjdxtN0sHRb9gRJBz8wegPWr4wRe

