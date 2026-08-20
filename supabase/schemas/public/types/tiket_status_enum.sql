create type "public"."tiket_status_enum" as enum (
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING',
  'RESOLVED',
  'CLOSED'
);

grant usage on type "public"."tiket_status_enum" to "postgres";
