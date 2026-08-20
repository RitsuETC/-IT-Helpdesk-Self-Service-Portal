alter table public.knowledge_article
  add column if not exists video_url varchar(500);
