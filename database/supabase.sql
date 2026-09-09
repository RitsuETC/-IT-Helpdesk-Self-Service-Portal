-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.unit (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  ruangan character varying,
  CONSTRAINT unit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.level (
  level USER-DEFINED NOT NULL,
  CONSTRAINT level_pkey PRIMARY KEY (level)
);
CREATE TABLE public.knowledge_kategori (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama_kategori character varying,
  CONSTRAINT knowledge_kategori_pkey PRIMARY KEY (id)
);
CREATE TABLE public.login (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nama character varying,
  email character varying,
  password character varying,
  role USER-DEFINED,
  CONSTRAINT login_pkey PRIMARY KEY (id)
);
CREATE TABLE public.asset (
  id_asset integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  asset_code character varying NOT NULL UNIQUE,
  id_ruangan integer NOT NULL,
  status USER-DEFINED NOT NULL,
  CONSTRAINT asset_pkey PRIMARY KEY (id_asset),
  CONSTRAINT asset_id_ruangan_fkey FOREIGN KEY (id_ruangan) REFERENCES public.unit(id)
);
CREATE TABLE public.knowledge_article (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_categori integer NOT NULL,
  judul character varying NOT NULL,
  content text NOT NULL,
  level USER-DEFINED NOT NULL,
  helpful integer NOT NULL DEFAULT 0,
  unhelpful integer NOT NULL DEFAULT 0,
  video_url character varying,
  tags text NOT NULL DEFAULT ''::text,
  CONSTRAINT knowledge_article_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_article_id_categori_fkey FOREIGN KEY (id_categori) REFERENCES public.knowledge_kategori(id)
);
CREATE TABLE public.tiket (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  judul character varying NOT NULL,
  categori integer NOT NULL,
  ruangan integer NOT NULL,
  prioritas USER-DEFINED NOT NULL,
  deskripsi text NOT NULL,
  akun integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'NEW'::tiket_status_enum,
  teknisi integer,
  solusi text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone,
  CONSTRAINT tiket_pkey PRIMARY KEY (id),
  CONSTRAINT tiket_categori_fkey FOREIGN KEY (categori) REFERENCES public.knowledge_kategori(id),
  CONSTRAINT tiket_ruangan_fkey FOREIGN KEY (ruangan) REFERENCES public.unit(id),
  CONSTRAINT tiket_prioritas_fkey FOREIGN KEY (prioritas) REFERENCES public.level(level),
  CONSTRAINT tiket_akun_fkey FOREIGN KEY (akun) REFERENCES public.login(id),
  CONSTRAINT tiket_teknisi_fkey FOREIGN KEY (teknisi) REFERENCES public.login(id)
);
CREATE TABLE public.troubleshooting (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_tiket integer NOT NULL,
  lampiran integer NOT NULL,
  tindakan text NOT NULL,
  hasil text NOT NULL,
  CONSTRAINT troubleshooting_pkey PRIMARY KEY (id),
  CONSTRAINT troubleshooting_id_tiket_fkey FOREIGN KEY (id_tiket) REFERENCES public.tiket(id)
);
CREATE TABLE public.invalid_tokens (
  id integer NOT NULL DEFAULT nextval('invalid_tokens_id_seq'::regclass),
  token_hash text NOT NULL,
  token_preview text,
  user_id integer,
  reason text,
  ip text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invalid_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer,
  tiket_id integer,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.login(id),
  CONSTRAINT notifications_tiket_id_fkey FOREIGN KEY (tiket_id) REFERENCES public.tiket(id)
);