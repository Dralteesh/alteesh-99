create type public.app_role as enum ('admin', 'doctor');

create table public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own profile or admin read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid());
create policy "own roles or admin read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.clinic_branding (
  id int primary key default 1 check (id = 1),
  clinic_name text not null default 'Alteesh Clinic',
  tagline text not null default 'إدارة عيادة الأسنان',
  welcome_title text not null default 'أهلاً بك في العيادة',
  welcome_text text not null default 'إليك صورة سريعة عن سير العمل اليوم.',
  primary_color text not null default '#28777d',
  accent_color text not null default '#e79274',
  logo_url text,
  background_url text,
  updated_at timestamptz not null default now()
);
grant select on public.clinic_branding to anon, authenticated;
grant update on public.clinic_branding to authenticated;
grant all on public.clinic_branding to service_role;
alter table public.clinic_branding enable row level security;
create policy "branding public read" on public.clinic_branding for select to anon, authenticated using (true);
create policy "branding admin update" on public.clinic_branding for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.clinic_branding (id) values (1);