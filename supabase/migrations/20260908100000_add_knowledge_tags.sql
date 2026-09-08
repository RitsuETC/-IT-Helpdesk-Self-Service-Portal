alter table public.knowledge_article
  add column if not exists tags text not null default '';