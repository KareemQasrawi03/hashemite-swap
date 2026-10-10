-- Hashemite Swap — full database setup.
-- Run once in Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.

-- =====================================================================
-- Lookup tables
-- =====================================================================
create table if not exists public.colleges (
  id      text primary key,
  name_ar text not null,
  name_en text not null,
  sort    int  not null default 0
);

create table if not exists public.categories (
  id      text primary key,
  icon    text not null,
  name_ar text not null,
  name_en text not null,
  sort    int  not null default 0
);

create table if not exists public.conditions (
  id      text primary key,
  name_ar text not null,
  name_en text not null,
  sort    int  not null default 0
);

-- =====================================================================
-- Listings
-- =====================================================================
create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  title          text not null check (char_length(title) between 1 and 80),
  title_en       text,
  description    text not null default '' check (char_length(description) <= 300),
  description_en text,
  want           text not null check (char_length(want) between 1 and 120),
  want_en        text,
  category       text not null references public.categories(id),
  condition      text not null references public.conditions(id),
  college        text not null references public.colleges(id),
  owner_name     text not null default '' check (char_length(owner_name) <= 40),
  phone          text check (phone ~ '^07[789][0-9]{7}$'),
  image_url      text check (
                   image_url is null
                   or image_url like 'https://%.supabase.co/storage/v1/object/public/listing-images/%'
                 ),
  is_example     boolean not null default false,
  -- Secret that lets the poster delete their listing. Never readable by visitors.
  edit_token     text not null default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  constraint listings_phone_required check (is_example or phone is not null)
);

-- Moderation: new listings wait for an admin. Rows that existed before this column are kept approved.
alter table public.listings add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved'));
alter table public.listings alter column status set default 'pending';
-- 'swapped': the owner removed the listing because the swap happened. Kept (hidden) for the admin stats.
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check check (status in ('pending', 'approved', 'swapped'));
alter table public.listings add column if not exists swapped_at timestamptz;

-- Supabase Auth users allowed to moderate. Create the users in the dashboard, then see "Admins" below.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_phone_created_idx on public.listings (phone, created_at desc);

-- =====================================================================
-- Row level security & grants
-- =====================================================================
alter table public.colleges   enable row level security;
alter table public.categories enable row level security;
alter table public.conditions enable row level security;
alter table public.listings   enable row level security;
alter table public.admins     enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "colleges are public"   on public.colleges;
drop policy if exists "categories are public" on public.categories;
drop policy if exists "conditions are public" on public.conditions;
drop policy if exists "listings are public"   on public.listings;
drop policy if exists "approved listings are public" on public.listings;
create policy "colleges are public"   on public.colleges   for select using (true);
create policy "categories are public" on public.categories for select using (true);
create policy "conditions are public" on public.conditions for select using (true);
-- Visitors see approved listings only; admins also see the review queue.
create policy "approved listings are public" on public.listings
  for select using (status = 'approved' or public.is_admin());

revoke all on public.colleges, public.categories, public.conditions, public.listings, public.admins from anon, authenticated;
grant select on public.colleges, public.categories, public.conditions to anon, authenticated;
-- Every column except edit_token. Inserts and deletes go only through the functions below.
grant select (id, created_at, title, title_en, description, description_en, want, want_en,
              category, condition, college, owner_name, phone, image_url, is_example, status, swapped_at)
  on public.listings to anon, authenticated;

-- =====================================================================
-- Functions
-- =====================================================================
create or replace function public.create_listing(
  p_title       text,
  p_description text,
  p_want        text,
  p_category    text,
  p_condition   text,
  p_college     text,
  p_owner_name  text,
  p_phone       text,
  p_image_url   text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.listings;
begin
  -- Phone ownership is checked by an admin before approval: the poster sends the
  -- listing's code over WhatsApp from that number (see the admin page).

  -- Every field is required, including the photo.
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = '' or coalesce(trim(p_want), '') = ''
     or coalesce(trim(p_owner_name), '') = '' or coalesce(p_image_url, '') = '' then
    raise exception 'missing_fields' using errcode = 'P0001';
  end if;

  -- At most 5 listings per phone number per hour.
  if (select count(*) from public.listings l
      where l.phone = p_phone and l.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.listings (title, description, want, category, condition, college, owner_name, phone, image_url)
  values (trim(p_title), coalesce(trim(p_description), ''), trim(p_want), p_category, p_condition, p_college,
          coalesce(trim(p_owner_name), ''), p_phone, nullif(p_image_url, ''))
  returning * into r;

  return json_build_object('id', r.id, 'edit_token', r.edit_token);
end;
$$;

create or replace function public.delete_listing(p_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.listings
  where id = p_id and edit_token = p_token and not is_example;
  return found;
end;
$$;

-- Owner closes their listing because the swap happened: hidden from visitors, counted in the admin stats.
create or replace function public.mark_swapped(p_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings set status = 'swapped', swapped_at = now()
  where id = p_id and edit_token = p_token and status = 'approved' and not is_example;
  return found;
end;
$$;

revoke all on function public.mark_swapped(uuid, text) from public;
grant execute on function public.mark_swapped(uuid, text) to anon, authenticated;

revoke all on function public.create_listing(text, text, text, text, text, text, text, text, text) from public;
revoke all on function public.delete_listing(uuid, text) from public;
grant execute on function public.create_listing(text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_listing(uuid, text) to anon, authenticated;

-- =====================================================================
-- Admin moderation (callers must be in public.admins)
-- =====================================================================
create or replace function public.approve_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.listings set status = 'approved' where id = p_id;
  return found;
end;
$$;

create or replace function public.admin_delete_listing(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  delete from public.listings where id = p_id;
  return found;
end;
$$;

revoke all on function public.approve_listing(uuid) from public;
revoke all on function public.admin_delete_listing(uuid) from public;
grant execute on function public.approve_listing(uuid) to authenticated;
grant execute on function public.admin_delete_listing(uuid) to authenticated;

-- =====================================================================
-- Storage bucket for item photos (resized to <=640px JPEG in the browser)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 512000, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can upload listing images" on storage.objects;
create policy "anyone can upload listing images" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'listing-images');

-- =====================================================================
-- Seed data
-- =====================================================================
insert into public.colleges (id, name_ar, name_en, sort) values
  ('arts',    'كلية الآداب',                      'Faculty of Arts', 1),
  ('science', 'كلية العلوم',                      'Faculty of Science', 2),
  ('edu',     'كلية العلوم التربوية',             'Faculty of Educational Sciences', 3),
  ('econ',    'كلية الاقتصاد والعلوم الإدارية',   'Faculty of Economics & Administrative Sciences', 4),
  ('eng',     'كلية الهندسة',                     'Faculty of Engineering', 5),
  ('it',      'كلية تكنولوجيا المعلومات',         'Faculty of Information Technology', 6),
  ('med',     'كلية الطب',                        'Faculty of Medicine', 7),
  ('nurs',    'كلية التمريض',                     'Faculty of Nursing', 8),
  ('allied',  'كلية العلوم الطبية التطبيقية',     'Faculty of Allied Medical Sciences', 9),
  ('pharm',   'كلية الصيدلة',                     'Faculty of Pharmacy', 10),
  ('nat',     'كلية الموارد الطبيعية والبيئة',    'Faculty of Natural Resources & Environment', 11),
  ('other',   'أخرى',                             'Other', 99)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, sort = excluded.sort;

insert into public.categories (id, icon, name_ar, name_en, sort) values
  ('books',       'book',   'كتب ومراجع',        'Books & notes', 1),
  ('electronics', 'cpu',    'إلكترونيات',        'Electronics', 2),
  ('lab',         'ruler',  'أدوات مخبر وهندسة', 'Lab & engineering', 3),
  ('clothes',     'shirt',  'ملابس ومعاطف',      'Clothing', 4),
  ('stationery',  'pencil', 'قرطاسية',           'Stationery', 5),
  ('other',       'box',    'أخرى',              'Other', 99)
on conflict (id) do update set icon = excluded.icon, name_ar = excluded.name_ar, name_en = excluded.name_en, sort = excluded.sort;

insert into public.conditions (id, name_ar, name_en, sort) values
  ('new',       'جديد',    'New', 1),
  ('excellent', 'ممتازة',  'Excellent', 2),
  ('good',      'جيدة',    'Good', 3),
  ('used',      'مستعملة', 'Used', 4)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, sort = excluded.sort;

-- Example listings: shown only while there are no real listings yet.
insert into public.listings (is_example, status, category, college, condition, title, title_en, description, description_en, want, want_en, created_at)
select true, 'approved', v.*
from (values
  ('books', 'econ', 'good',
   'كتاب مبادئ المحاسبة المالية', 'Financial accounting textbook',
   'نسخة عليها تظليل بقلم رصاص فقط، تصلح لمساقات السنة الأولى.', 'Only light pencil marks, suitable for first-year courses.',
   'كتاب مبادئ الإحصاء', 'A statistics fundamentals textbook', now() - interval '1 minute'),
  ('lab', 'eng', 'excellent',
   'آلة حاسبة علمية Casio fx-991', 'Casio fx-991 scientific calculator',
   'تعمل بشكل ممتاز ومعها الغطاء الأصلي.', 'Works perfectly and comes with its original cover.',
   'طقم أدوات رسم هندسي', 'A technical drawing set', now() - interval '2 minutes'),
  ('clothes', 'science', 'good',
   'معطف مخبر أبيض مقاس M', 'White lab coat, size M',
   'مغسول ونظيف، استُخدم فصلًا دراسيًا واحدًا.', 'Washed and clean, worn for one semester.',
   'معطف مخبر مقاس L', 'A lab coat in size L', now() - interval '3 minutes'),
  ('electronics', 'it', 'excellent',
   'لوحة مفاتيح ميكانيكية', 'Mechanical keyboard',
   'إضاءة خلفية وتخطيط عربي وإنجليزي.', 'Backlit, with Arabic and English layout.',
   'ماوس لاسلكي أو سماعات', 'A wireless mouse or headphones', now() - interval '4 minutes'),
  ('books', 'med', 'good',
   'أطلس تشريح للطلبة', 'Student anatomy atlas',
   'الغلاف سليم وبعض الصفحات عليها تظليل.', 'Cover is intact and a few pages are highlighted.',
   'كتاب فسيولوجيا', 'A physiology textbook', now() - interval '5 minutes'),
  ('stationery', 'arts', 'new',
   'ملخصات مطبوعة لمساقات الأدب', 'Printed literature course summaries',
   'ملخصات منظمة لثلاثة مساقات، مجلّدة وجاهزة للدراسة.', 'Organised summaries for three courses, bound and ready to study.',
   'دفاتر محاضرات فارغة', 'Blank lecture notebooks', now() - interval '6 minutes'),
  ('other', 'nurs', 'used',
   'سماعة طبية', 'Stethoscope',
   'سليمة وتعمل جيدًا، مع أذنيات احتياطية.', 'In good working order, with spare ear tips.',
   'ساعة يد بعقرب ثواني', 'A watch with a second hand', now() - interval '7 minutes'),
  ('electronics', 'eng', 'good',
   'باور بانك 10000 مللي أمبير', '10,000 mAh power bank',
   'يشحن الهاتف مرتين تقريبًا، مع كيبل.', 'Charges a phone about twice, cable included.',
   'سماعات بلوتوث', 'Bluetooth earbuds', now() - interval '8 minutes')
) as v(category, college, condition, title, title_en, description, description_en, want, want_en, created_at)
where not exists (select 1 from public.listings where is_example);

-- =====================================================================
-- Admins
-- First create each admin in Supabase dashboard -> Authentication -> Users ->
-- Add user -> Create new user (tick "Auto Confirm User"). The site's login form
-- turns a username into <username>@example.com, so use these emails:
-- =====================================================================
insert into public.admins (user_id)
select id from auth.users
where lower(email) in ('eyadqasrawi@example.com', 'kareemqasrawi@example.com')
on conflict (user_id) do nothing;
