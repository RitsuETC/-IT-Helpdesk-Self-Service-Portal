create type "public"."priority_level_enum" as enum (
  'level_1',
  'level_2',
  'level_3'
);

grant usage on type "public"."priority_level_enum" to "postgres";
