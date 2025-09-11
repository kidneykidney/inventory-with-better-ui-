--
-- PostgreSQL database dump
--

\restrict QCnOOp0Mn3Vby6ayqbe6N9vZy5N6zgW7HCxKymymKH6iehupHRtL1GfyPYIeH2h

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

\unrestrict QCnOOp0Mn3Vby6ayqbe6N9vZy5N6zgW7HCxKymymKH6iehupHRtL1GfyPYIeH2h

