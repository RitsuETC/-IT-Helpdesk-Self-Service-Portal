create type "public"."asset_status_enum" as enum (
  'repair',
  'broken'
);

grant usage on type "public"."asset_status_enum" to "postgres";
