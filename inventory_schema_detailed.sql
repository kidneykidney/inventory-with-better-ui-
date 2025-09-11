--
-- PostgreSQL database dump
--

\restrict wia5WZku1rdhK0jJ0MJVveZxDSM7BhKk77K8tt1CbTtjkZqOSdKpRWnWIV7bRSp

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-11 09:50:11

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

DROP DATABASE IF EXISTS inventory_management;
--
-- TOC entry 5179 (class 1262 OID 16870)
-- Name: inventory_management; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE inventory_management WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_India.1252';


ALTER DATABASE inventory_management OWNER TO postgres;

\unrestrict wia5WZku1rdhK0jJ0MJVveZxDSM7BhKk77K8tt1CbTtjkZqOSdKpRWnWIV7bRSp
\connect inventory_management
\restrict wia5WZku1rdhK0jJ0MJVveZxDSM7BhKk77K8tt1CbTtjkZqOSdKpRWnWIV7bRSp

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
-- TOC entry 2 (class 3079 OID 16871)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 253 (class 1255 OID 17193)
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
-- TOC entry 267 (class 1255 OID 17210)
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
-- TOC entry 252 (class 1255 OID 17191)
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
-- TOC entry 266 (class 1255 OID 17208)
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
-- TOC entry 265 (class 1255 OID 17017)
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
-- TOC entry 251 (class 1255 OID 17016)
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
-- TOC entry 240 (class 1259 OID 17276)
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
-- TOC entry 239 (class 1259 OID 17275)
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
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 239
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 218 (class 1259 OID 16882)
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
-- TOC entry 227 (class 1259 OID 17129)
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
-- TOC entry 226 (class 1259 OID 17099)
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
-- TOC entry 225 (class 1259 OID 17066)
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
-- TOC entry 221 (class 1259 OID 16932)
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
-- TOC entry 229 (class 1259 OID 17158)
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
-- TOC entry 220 (class 1259 OID 16917)
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
-- TOC entry 230 (class 1259 OID 17195)
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
-- TOC entry 228 (class 1259 OID 17144)
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
-- TOC entry 224 (class 1259 OID 16993)
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
-- TOC entry 222 (class 1259 OID 16954)
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
-- TOC entry 223 (class 1259 OID 16979)
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
-- TOC entry 219 (class 1259 OID 16894)
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
-- TOC entry 231 (class 1259 OID 17211)
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
-- TOC entry 232 (class 1259 OID 17215)
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
-- TOC entry 234 (class 1259 OID 17221)
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
-- TOC entry 233 (class 1259 OID 17220)
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
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 233
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- TOC entry 238 (class 1259 OID 17256)
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
-- TOC entry 237 (class 1259 OID 17255)
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
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 236 (class 1259 OID 17238)
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
-- TOC entry 235 (class 1259 OID 17237)
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
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4916 (class 2604 OID 17279)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 17224)
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 17259)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 17241)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4998 (class 2606 OID 17285)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 16893)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 4922 (class 2606 OID 16891)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 17138)
-- Name: invoice_images invoice_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_images
    ADD CONSTRAINT invoice_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 17113)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 17152)
-- Name: invoice_transactions invoice_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_transactions
    ADD CONSTRAINT invoice_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 17088)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 4964 (class 2606 OID 17086)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 17002)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 16968)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 16948)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 4944 (class 2606 OID 16946)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 2606 OID 16987)
-- Name: product_transactions product_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_transactions
    ADD CONSTRAINT product_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4927 (class 2606 OID 16909)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4929 (class 2606 OID 16911)
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- TOC entry 4978 (class 2606 OID 17167)
-- Name: student_acknowledgments student_acknowledgments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_pkey PRIMARY KEY (id);


--
-- TOC entry 4936 (class 2606 OID 16927)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 4982 (class 2606 OID 17234)
-- Name: system_settings system_settings_category_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_category_key_key UNIQUE (category, key);


--
-- TOC entry 4984 (class 2606 OID 17232)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 17267)
-- Name: user_sessions user_sessions_access_token_jti_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_access_token_jti_key UNIQUE (access_token_jti);


--
-- TOC entry 4994 (class 2606 OID 17265)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4996 (class 2606 OID 17269)
-- Name: user_sessions user_sessions_refresh_token_jti_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_jti_key UNIQUE (refresh_token_jti);


--
-- TOC entry 4986 (class 2606 OID 17254)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4988 (class 2606 OID 17250)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4990 (class 2606 OID 17252)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4969 (class 1259 OID 17186)
-- Name: idx_invoice_images_image_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_images_image_type ON public.invoice_images USING btree (image_type);


--
-- TOC entry 4970 (class 1259 OID 17185)
-- Name: idx_invoice_images_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_images_invoice_id ON public.invoice_images USING btree (invoice_id);


--
-- TOC entry 4965 (class 1259 OID 17183)
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- TOC entry 4966 (class 1259 OID 17184)
-- Name: idx_invoice_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_product_id ON public.invoice_items USING btree (product_id);


--
-- TOC entry 4973 (class 1259 OID 17187)
-- Name: idx_invoice_transactions_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_transactions_invoice_id ON public.invoice_transactions USING btree (invoice_id);


--
-- TOC entry 4956 (class 1259 OID 17181)
-- Name: idx_invoices_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);


--
-- TOC entry 4957 (class 1259 OID 17182)
-- Name: idx_invoices_issue_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_issue_date ON public.invoices USING btree (issue_date);


--
-- TOC entry 4958 (class 1259 OID 17178)
-- Name: idx_invoices_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_order_id ON public.invoices USING btree (order_id);


--
-- TOC entry 4959 (class 1259 OID 17180)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 4960 (class 1259 OID 17179)
-- Name: idx_invoices_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_student_id ON public.invoices USING btree (student_id);


--
-- TOC entry 4952 (class 1259 OID 17015)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 4953 (class 1259 OID 17014)
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- TOC entry 4945 (class 1259 OID 17011)
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- TOC entry 4946 (class 1259 OID 17012)
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- TOC entry 4938 (class 1259 OID 17010)
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);


--
-- TOC entry 4939 (class 1259 OID 17009)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4940 (class 1259 OID 17008)
-- Name: idx_orders_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_student_id ON public.orders USING btree (student_id);


--
-- TOC entry 4949 (class 1259 OID 17013)
-- Name: idx_product_transactions_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_transactions_product_id ON public.product_transactions USING btree (product_id);


--
-- TOC entry 4923 (class 1259 OID 17003)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- TOC entry 4924 (class 1259 OID 17004)
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- TOC entry 4925 (class 1259 OID 17005)
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- TOC entry 4979 (class 1259 OID 17235)
-- Name: idx_settings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settings_category ON public.system_settings USING btree (category);


--
-- TOC entry 4980 (class 1259 OID 17236)
-- Name: idx_settings_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settings_key ON public.system_settings USING btree (category, key);


--
-- TOC entry 4976 (class 1259 OID 17188)
-- Name: idx_student_acknowledgments_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_acknowledgments_invoice_id ON public.student_acknowledgments USING btree (invoice_id);


--
-- TOC entry 4930 (class 1259 OID 17007)
-- Name: idx_students_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email ON public.students USING btree (email);


--
-- TOC entry 4931 (class 1259 OID 17205)
-- Name: idx_students_email_flexible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email_flexible ON public.students USING btree (email);


--
-- TOC entry 4932 (class 1259 OID 17006)
-- Name: idx_students_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_student_id ON public.students USING btree (student_id);


--
-- TOC entry 4933 (class 1259 OID 17204)
-- Name: idx_students_student_id_flexible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_student_id_flexible ON public.students USING btree (student_id);


--
-- TOC entry 4934 (class 1259 OID 17207)
-- Name: students_email_unique_when_not_empty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX students_email_unique_when_not_empty ON public.students USING btree (email) WHERE ((email IS NOT NULL) AND ((email)::text <> ''::text));


--
-- TOC entry 4937 (class 1259 OID 17206)
-- Name: students_student_id_unique_when_not_empty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX students_student_id_unique_when_not_empty ON public.students USING btree (student_id) WHERE ((student_id IS NOT NULL) AND ((student_id)::text <> ''::text));


--
-- TOC entry 5019 (class 2620 OID 17194)
-- Name: orders create_lending_invoice_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER create_lending_invoice_trigger AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.create_lending_invoice();


--
-- TOC entry 5023 (class 2620 OID 17192)
-- Name: invoices generate_invoice_number_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (((new.invoice_number IS NULL) OR ((new.invoice_number)::text = ''::text))) EXECUTE FUNCTION public.generate_invoice_number();


--
-- TOC entry 5017 (class 2620 OID 17209)
-- Name: students generate_student_id_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_student_id_trigger BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.generate_student_id();


--
-- TOC entry 5015 (class 2620 OID 17061)
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5025 (class 2620 OID 17190)
-- Name: invoice_items update_invoice_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5024 (class 2620 OID 17189)
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5021 (class 2620 OID 17065)
-- Name: order_items update_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5020 (class 2620 OID 17064)
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5022 (class 2620 OID 17060)
-- Name: order_items update_product_quantity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_product_quantity_trigger AFTER INSERT OR DELETE OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity();


--
-- TOC entry 5016 (class 2620 OID 17062)
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5018 (class 2620 OID 17063)
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5014 (class 2606 OID 17286)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5009 (class 2606 OID 17139)
-- Name: invoice_images invoice_images_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_images
    ADD CONSTRAINT invoice_images_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5006 (class 2606 OID 17114)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5007 (class 2606 OID 17124)
-- Name: invoice_items invoice_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- TOC entry 5008 (class 2606 OID 17119)
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 17153)
-- Name: invoice_transactions invoice_transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_transactions
    ADD CONSTRAINT invoice_transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 17089)
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5005 (class 2606 OID 17094)
-- Name: invoices invoices_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5001 (class 2606 OID 16969)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5002 (class 2606 OID 16974)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5000 (class 2606 OID 16949)
-- Name: orders orders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5003 (class 2606 OID 16988)
-- Name: product_transactions product_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_transactions
    ADD CONSTRAINT product_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4999 (class 2606 OID 16912)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5011 (class 2606 OID 17168)
-- Name: student_acknowledgments student_acknowledgments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 17173)
-- Name: student_acknowledgments student_acknowledgments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_acknowledgments
    ADD CONSTRAINT student_acknowledgments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 17270)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-09-11 09:50:12

--
-- PostgreSQL database dump complete
--

\unrestrict wia5WZku1rdhK0jJ0MJVveZxDSM7BhKk77K8tt1CbTtjkZqOSdKpRWnWIV7bRSp

