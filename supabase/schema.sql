-- LanguageMap community submissions schema.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Before running, replace ADMIN_EMAIL below if needed. The admin signs in to
-- /admin with a magic link sent to this address; only this account can read
-- and review submissions.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('flag_word', 'fill_words', 'new_language')),
  language_id text,
  payload jsonb not null,
  contributor_name text,
  contributor_contact text,
  source text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'applied')),
  review_note text,
  fingerprint text not null,
  dup_count integer not null default 1,
  ip_hash text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  applied_at timestamptz
);

-- Identical pending suggestions merge into one row (dup_count++), so the
-- review queue never fills with duplicates.
create unique index submissions_pending_fingerprint
  on public.submissions (fingerprint)
  where status = 'pending';

create index submissions_status_created
  on public.submissions (status, created_at desc);

create index submissions_ip_recent
  on public.submissions (ip_hash, created_at);

-- ---------------------------------------------------------------------------
-- Row-level security: nobody touches the table directly except the admin.
-- Anonymous visitors submit only through the submit_suggestion() RPC below.
-- ---------------------------------------------------------------------------

alter table public.submissions enable row level security;

create policy admin_select on public.submissions
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'allysons703@gmail.com'); -- ADMIN_EMAIL

create policy admin_update on public.submissions
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'allysons703@gmail.com')  -- ADMIN_EMAIL
  with check ((auth.jwt() ->> 'email') = 'allysons703@gmail.com'); -- ADMIN_EMAIL

-- ---------------------------------------------------------------------------
-- Submission RPC: validates, rate-limits, dedupes. SECURITY DEFINER so it can
-- write to the table while anon has no direct table grants.
-- ---------------------------------------------------------------------------

create or replace function public.submit_suggestion(
  p_type text,
  p_language_id text,
  p_payload jsonb,
  p_contributor_name text default null,
  p_contributor_contact text default null,
  p_source text default null,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_ip_hash text;
  v_recent integer;
  v_fingerprint text;
  v_existing uuid;
  v_id uuid;
  v_key text;
  v_value jsonb;
begin
  -- Structural validation. The client validates too, but the client can be
  -- bypassed; this is the authoritative check.
  if p_type is null or p_type not in ('flag_word', 'fill_words', 'new_language') then
    raise exception 'invalid submission type';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be an object';
  end if;
  if length(p_payload::text) > 20000 then
    raise exception 'payload too large';
  end if;
  if length(coalesce(p_contributor_name, '')) > 200
     or length(coalesce(p_contributor_contact, '')) > 200
     or length(coalesce(p_source, '')) > 1000
     or length(coalesce(p_note, '')) > 2000 then
    raise exception 'field too long';
  end if;

  if p_type in ('flag_word', 'fill_words') then
    if p_language_id is null or p_language_id !~ '^[a-z0-9][a-z0-9-]{0,63}$' then
      raise exception 'invalid language id';
    end if;
  end if;

  if p_type = 'flag_word' then
    if coalesce(p_payload ->> 'wordId', '') !~ '^[a-z0-9][a-z0-9-]{0,63}$' then
      raise exception 'flag_word requires a valid wordId';
    end if;
    if coalesce(trim(p_payload ->> 'suggestedValue'), '') = ''
       or length(p_payload ->> 'suggestedValue') > 200 then
      raise exception 'flag_word requires a suggestedValue under 200 characters';
    end if;
  elsif p_type = 'fill_words' then
    if p_payload -> 'words' is null or jsonb_typeof(p_payload -> 'words') <> 'object' then
      raise exception 'fill_words requires a words object';
    end if;
    if (select count(*) from jsonb_object_keys(p_payload -> 'words')) = 0 then
      raise exception 'fill_words requires at least one word';
    end if;
    for v_key, v_value in select * from jsonb_each(p_payload -> 'words') loop
      if v_key !~ '^[a-z0-9][a-z0-9-]{0,63}$'
         or jsonb_typeof(v_value) <> 'string'
         or coalesce(trim(v_value #>> '{}'), '') = ''
         or length(v_value #>> '{}') > 200 then
        raise exception 'invalid word entry: %', v_key;
      end if;
    end loop;
  elsif p_type = 'new_language' then
    if coalesce(trim(p_payload ->> 'name'), '') = ''
       or length(p_payload ->> 'name') > 200 then
      raise exception 'new_language requires a name under 200 characters';
    end if;
  end if;

  -- Rate limit: max 20 submissions per IP per hour. Supabase forwards the
  -- client IP in the x-forwarded-for request header.
  v_ip := split_part(
    coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
    ',', 1);
  v_ip_hash := md5('languagemap:' || v_ip);
  select count(*) into v_recent
    from public.submissions
    where ip_hash = v_ip_hash and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'rate limit exceeded — please try again later';
  end if;

  -- Dedup: identical pending suggestions merge, counting how many people
  -- made them.
  if p_type = 'flag_word' then
    v_fingerprint := md5(p_type || '|' || p_language_id || '|'
      || (p_payload ->> 'wordId') || '|'
      || lower(trim(p_payload ->> 'suggestedValue')));
  else
    v_fingerprint := md5(p_type || '|' || coalesce(p_language_id, '') || '|'
      || p_payload::text);
  end if;

  select id into v_existing
    from public.submissions
    where fingerprint = v_fingerprint and status = 'pending'
    limit 1;
  if v_existing is not null then
    update public.submissions
      set dup_count = dup_count + 1
      where id = v_existing;
    return jsonb_build_object('result', 'merged', 'id', v_existing);
  end if;

  insert into public.submissions
    (type, language_id, payload, contributor_name, contributor_contact,
     source, note, fingerprint, ip_hash)
  values
    (p_type, p_language_id, p_payload,
     nullif(trim(p_contributor_name), ''), nullif(trim(p_contributor_contact), ''),
     nullif(trim(p_source), ''), nullif(trim(p_note), ''),
     v_fingerprint, v_ip_hash)
  returning id into v_id;

  return jsonb_build_object('result', 'created', 'id', v_id);
end;
$$;

revoke all on function public.submit_suggestion from public;
grant execute on function public.submit_suggestion to anon, authenticated;
