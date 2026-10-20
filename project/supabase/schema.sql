create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  is_admin boolean default false,
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.wallet_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  coin text not null,
  label text,
  network text,
  address text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal')),
  method text not null check (method in ('crypto', 'card', 'bank')),
  asset text not null,
  amount numeric(18,2) not null check (amount > 0),
  status text not null check (status in ('pending', 'approved', 'rejected', 'completed', 'processing')),
  reference text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  method text not null check (method in ('crypto', 'card', 'bank')),
  asset text not null,
  amount numeric(18,2) not null check (amount > 0),
  wallet_address text,
  tx_hash text,
  reference text unique not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'completed')),
  proof_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  method text not null check (method in ('crypto', 'bank', 'card')),
  asset text not null,
  amount numeric(18,2) not null check (amount > 0),
  destination text not null,
  status text not null check (status in ('pending', 'processing', 'approved', 'rejected', 'completed')),
  reference text unique not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_audit (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.wallet_addresses enable row level security;
alter table public.transactions enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.admin_audit enable row level security;

create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can view own wallet addresses"
on public.wallet_addresses
for select
using (auth.uid() = user_id);

create policy "Users can insert own wallet addresses"
on public.wallet_addresses
for insert
with check (auth.uid() = user_id);

create policy "Users can view own transactions"
on public.transactions
for select
using (auth.uid() = user_id);

create policy "Users can create own deposits"
on public.deposits
for insert
with check (auth.uid() = user_id);

create policy "Users can view own deposits"
on public.deposits
for select
using (auth.uid() = user_id);

create policy "Users can create own withdrawals"
on public.withdrawals
for insert
with check (auth.uid() = user_id);

create policy "Users can view own withdrawals"
on public.withdrawals
for select
using (auth.uid() = user_id);

create policy "Admins can view all profiles"
on public.profiles
for select
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin = true
));

create policy "Admins can view all transactions"
on public.transactions
for select
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin = true
));

create policy "Admins can view all deposits"
on public.deposits
for select
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin = true
));

create policy "Admins can view all withdrawals"
on public.withdrawals
for select
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.is_admin = true
));
