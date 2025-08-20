-- Fix RLS policies without using "IF NOT EXISTS" on CREATE POLICY.
-- This script is safe/idempotent and avoids DROP statements.

-- Ensure RLS is enabled (idempotent)
alter table public.integration_tokens enable row level security;

-- Select policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'integration_tokens'
      and policyname = 'select own tokens'
  ) then
    create policy "select own tokens"
      on public.integration_tokens
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Insert policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'integration_tokens'
      and policyname = 'insert own tokens'
  ) then
    create policy "insert own tokens"
      on public.integration_tokens
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Update policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'integration_tokens'
      and policyname = 'update own tokens'
  ) then
    create policy "update own tokens"
      on public.integration_tokens
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Delete policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'integration_tokens'
      and policyname = 'delete own tokens'
  ) then
    create policy "delete own tokens"
      on public.integration_tokens
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Keep trigger function/current trigger as-is from prior scripts.
-- If you still need them, the following are idempotent and non-destructive:

-- create or replace function public.set_updated_at()
-- returns trigger as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$ language plpgsql;

-- do $$
-- begin
--   if not exists (
--     select 1 from pg_trigger where tgname = 'trg_set_updated_at_integration_tokens'
--   ) then
--     create trigger trg_set_updated_at_integration_tokens
--     before update on public.integration_tokens
--     for each row
--     execute function public.set_updated_at();
--   end if;
-- end $$;
