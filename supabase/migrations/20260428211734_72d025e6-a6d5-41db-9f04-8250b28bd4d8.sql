
-- Images table
create table public.images (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  description text,
  url text not null,
  thumbnail_url text,
  tags text[] not null default '{}',
  source text not null default 'manual',
  telegram_message_id bigint unique,
  width int,
  height int,
  view_count int not null default 0,
  download_count int not null default 0,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_images_taken_at on public.images (taken_at desc);
create index idx_images_tags on public.images using gin (tags);

alter table public.images enable row level security;

create policy "Public can view images"
  on public.images for select
  using (true);

-- No insert/update/delete policies => only service role can write.

-- Telegram polling state
create table public.telegram_bot_state (
  id int primary key check (id = 1),
  update_offset bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.telegram_bot_state (id, update_offset) values (1, 0);

alter table public.telegram_bot_state enable row level security;
-- No policies => only service role can read/write.

-- Atomic counter increment helpers
create or replace function public.increment_image_view(image_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.images set view_count = view_count + 1 where id = image_id;
$$;

create or replace function public.increment_image_download(image_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.images set download_count = download_count + 1 where id = image_id;
$$;

grant execute on function public.increment_image_view(uuid) to anon, authenticated;
grant execute on function public.increment_image_download(uuid) to anon, authenticated;

-- Seed sample images (Unsplash)
insert into public.images (title, description, url, thumbnail_url, tags, width, height, taken_at) values
  ('Morning Fog', 'Pine forest wrapped in light mist', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', array['nature','forest'], 1600, 1067, now() - interval '1 day'),
  ('Quiet Coast', 'Rocky shoreline at dusk', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600', array['ocean','travel'], 1600, 1067, now() - interval '2 days'),
  ('City Lines', 'Brutalist architecture detail', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600', array['architecture','city'], 1600, 2400, now() - interval '3 days'),
  ('Soft Window', 'Sun through linen curtains', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1600', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', array['interior','minimal'], 1600, 1067, now() - interval '5 days'),
  ('Open Road', 'Empty desert highway', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600', array['travel','landscape'], 1600, 1067, now() - interval '8 days'),
  ('Mountain Study', 'Granite peaks and clouds', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600', array['nature','mountain'], 1600, 1067, now() - interval '10 days'),
  ('Quiet Library', 'Wood, paper, afternoon light', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600', array['interior','books'], 1600, 1067, now() - interval '14 days'),
  ('Pale Petals', 'Cherry blossoms close up', 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600', 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600', array['nature','floral'], 1600, 2000, now() - interval '20 days'),
  ('Studio Stillness', 'Sculpture against plaster wall', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600', array['art','minimal'], 1600, 1067, now() - interval '30 days');
