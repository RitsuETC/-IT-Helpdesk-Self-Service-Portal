create table "public"."level" ();

alter table "public"."level"
  enable row level security;

alter table "public"."level"
  add column "level" public.priority_level_enum not null;

alter table "public"."level"
  add constraint "level_pkey" primary key (level);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."level" to "anon", "authenticated", "postgres", "service_role";
