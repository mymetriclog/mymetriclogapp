-- Enable required extension for gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Table: public.integration_tokens
create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  token_type text default 'Bearer',
  scope text,
  -- Unix epoch seconds; store when the access token expires (refresh ~60s early)
  expires_at bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- Helpful indexes
create index if not exists idx_integration_tokens_user on public.integration_tokens(user_id);
create index if not exists idx_integration_tokens_user_provider on public.integration_tokens(user_id, provider);
create index if not exists idx_integration_tokens_expires_at on public.integration_tokens(expires_at);

-- Row Level Security
alter table public.integration_tokens enable row level security;

-- Policies: users can only manage their own rows
create policy if not exists "select own tokens"
on public.integration_tokens
for select
using (auth.uid() = user_id);

create policy if not exists "insert own tokens"
on public.integration_tokens
for insert
with check (auth.uid() = user_id);

create policy if not exists "update own tokens"
on public.integration_tokens
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "delete own tokens"
on public.integration_tokens
for delete
using (auth.uid() = user_id);

-- Trigger to keep updated_at fresh on update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_integration_tokens on public.integration_tokens;

create trigger trg_set_updated_at_integration_tokens
before update on public.integration_tokens
for each row
execute function public.set_updated_at();
