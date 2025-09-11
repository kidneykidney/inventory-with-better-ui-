--
-- PostgreSQL database dump
--

\restrict nfnlCvfht1hB29vE1GcjgwCzVg5aoGpa60YFAHt4HZNK2o0XCLqPA9PgTM7c6KY

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
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id character varying(50),
    product_name character varying(255) NOT NULL,
    product_category character varying(100) DEFAULT 'General'::character varying,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_id character varying(50) NOT NULL,
    student_name character varying(255) NOT NULL,
    student_email character varying(255) NOT NULL,
    student_phone character varying(50),
    student_id character varying(50),
    department character varying(255),
    year character varying(50),
    course character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    total_amount numeric(10,2) DEFAULT 0.00,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipping_address text,
    notes text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    product_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    product_type character varying(20) DEFAULT 'physical'::character varying,
    total_quantity integer DEFAULT 0,
    available_quantity integer DEFAULT 0,
    unit_price numeric(10,2) DEFAULT 0.00,
    location character varying(255),
    manufacturer character varying(255),
    model_number character varying(100),
    is_active boolean DEFAULT true,
    is_lendable boolean DEFAULT false,
    max_lending_days integer DEFAULT 30,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_name, product_category, quantity, unit_price, total_price, created_at) FROM stdin;
1	ORD001	Laptop - Dell XPS 13	Electronics	1	350.00	350.00	2025-08-23 10:55:39.613163
2	ORD001	Programming Textbook	Books	2	50.00	100.00	2025-08-23 10:55:39.613163
3	ORD002	Marketing Strategy Book	Books	1	80.00	80.00	2025-08-23 10:55:39.613163
4	ORD002	Business Calculator	Stationery	1	120.00	120.00	2025-08-23 10:55:39.613163
5	ORD002	Notebook Set	Stationery	4	30.00	120.00	2025-08-23 10:55:39.613163
6	ORD003	Engineering Drawing Kit	Tools	1	200.00	200.00	2025-08-23 10:55:39.613163
7	ORD003	CAD Software License	Software	1	480.00	480.00	2025-08-23 10:55:39.613163
8	ORD003	Technical Handbook	Books	2	50.00	100.00	2025-08-23 10:55:39.613163
9	ORD004	Psychology Textbook	Books	1	120.00	120.00	2025-08-23 10:55:39.613163
10	ORD004	Study Guide	Books	1	45.00	45.00	2025-08-23 10:55:39.613163
11	ORD004	Highlighter Set	Stationery	1	45.00	45.00	2025-08-23 10:55:39.613163
12	ORD-57007	Standard Registration	Registration	1	0.00	0.00	2025-08-23 11:23:23.899929
13	ORD-71574	Standard Registration	Registration	1	0.00	0.00	2025-08-23 11:58:41.30845
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_id, student_name, student_email, student_phone, student_id, department, year, course, status, total_amount, order_date, updated_at, shipping_address, notes) FROM stdin;
1	ORD001	John Smith	john.smith@university.edu	+1-555-0101	STU001	Computer Science	3rd Year	Software Engineering	pending	450.00	2025-08-23 10:55:39.613163	2025-08-23 10:55:39.613163	\N	\N
2	ORD002	Emily Johnson	emily.j@university.edu	+1-555-0102	STU002	Business Administration	2nd Year	Marketing	confirmed	320.00	2025-08-23 10:55:39.613163	2025-08-23 10:55:39.613163	\N	\N
3	ORD003	Michael Brown	michael.b@university.edu	+1-555-0103	STU003	Engineering	4th Year	Mechanical Engineering	processing	780.00	2025-08-23 10:55:39.613163	2025-08-23 10:55:39.613163	\N	\N
4	ORD004	Sarah Davis	sarah.d@university.edu	+1-555-0104	STU004	Arts & Sciences	1st Year	Psychology	completed	210.00	2025-08-23 10:55:39.613163	2025-08-23 10:55:39.613163	\N	\N
5	ORD-57007	rarr	aer	\N	\N	Engineering	\N	\N	pending	0.00	2025-08-23 11:23:23.899929	2025-08-23 11:23:23.899929	\N	\N
6	ORD-71574	gugan	aer	\N	\N	Computer Science	\N	\N	pending	0.00	2025-08-23 11:58:41.30845	2025-08-23 11:58:41.30845	\N	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, product_code, name, description, category, product_type, total_quantity, available_quantity, unit_price, location, manufacturer, model_number, is_active, is_lendable, max_lending_days, created_at, updated_at) FROM stdin;
275	PRD-002	Raspberry Pi 4	Single board computer with 8GB RAM	Single Board Computers	returnable	25	20	85.00	Lab Storage Room A	Raspberry Pi Foundation	Pi4-8GB	t	t	14	2025-08-23 15:40:41.227201	2025-08-23 15:40:41.227201
276	PRD-003	LED Strips (5m)	RGB LED strip for lighting projects	LEDs & Lighting	consumable	100	85	15.00	Components Storage	Generic	RGB-5M	t	f	0	2025-08-23 15:40:41.227201	2025-08-23 15:40:41.227201
277	PRD-004	Breadboard Large	830-point solderless breadboard	Prototyping	returnable	75	70	8.50	Components Storage	Generic	BB-830	t	t	7	2025-08-23 15:40:41.227201	2025-08-23 15:40:41.227201
\.


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 13, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 6, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 277, true);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_id_key UNIQUE (order_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_date);


--
-- Name: idx_orders_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_order_id ON public.orders USING btree (order_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nfnlCvfht1hB29vE1GcjgwCzVg5aoGpa60YFAHt4HZNK2o0XCLqPA9PgTM7c6KY

