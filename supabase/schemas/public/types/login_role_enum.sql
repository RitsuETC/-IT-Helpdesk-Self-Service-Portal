create type "public"."login_role_enum" as enum (
  'user',
  'admin',
  'teknisi'
);

grant usage on type "public"."login_role_enum" to "postgres";
