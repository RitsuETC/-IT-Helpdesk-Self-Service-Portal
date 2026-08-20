create type "public"."knowledge_level_enum" as enum (
  'Level_1',
  'Level_2',
  'Level_3'
);

grant usage on type "public"."knowledge_level_enum" to "postgres";
