create extension if not exists pgcrypto;

create table public.workspace_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  template text not null default
    'Hi {{firstName}}, hope you’re doing well! I’m a recent B.Tech graduate currently looking for entry-level opportunities in Data Analytics and Data Engineering. I wanted to reach out and ask if you happen to know of any suitable openings at your company. If you come across any relevant roles, I’d really appreciate it if you could let me know. Thank you!',
  created_at timestamptz not null default now(),
  constraint template_length check (char_length(template) between 1 and 10000)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  company text not null default '',
  job_title text not null default '',
  linkedin_url text not null default '',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, id),
  constraint first_name_length
    check (char_length(btrim(first_name)) between 1 and 100),
  constraint last_name_length check (char_length(last_name) <= 100),
  constraint company_length check (char_length(company) <= 200),
  constraint job_title_length check (char_length(job_title) <= 200),
  constraint linkedin_url_length check (char_length(linkedin_url) <= 500)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  contact_id uuid,
  batch_id uuid not null,
  first_name text not null,
  last_name text not null default '',
  company text not null default '',
  linkedin_url text not null default '',
  template_snapshot text not null,
  body text not null,
  copied_count integer not null default 0 check (copied_count >= 0),
  sent_at timestamptz,
  created_at timestamptz not null default now(),

  -- Contact deletion retains message history.
  -- PostgreSQL 15+ supports column-specific SET NULL.
  foreign key (user_id, contact_id)
    references public.contacts(user_id, id)
    on delete set null (contact_id)
);

create index contacts_user_created
  on public.contacts(user_id, created_at);

create index messages_user_created
  on public.messages(user_id, created_at desc);

alter table public.workspace_settings enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;

create policy "Own settings only"
  on public.workspace_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Own contacts only"
  on public.contacts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Own messages only"
  on public.messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.workspace_settings, public.contacts, public.messages
  to authenticated;

-- Initializes each account once. Deleting demo contacts does not recreate them.
create or replace function public.initialize_workspace()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.workspace_settings(user_id)
  values (auth.uid())
  on conflict do nothing;

  if found then
    insert into public.contacts
      (user_id, first_name, last_name)
    values
      (auth.uid(), 'Nitin', 'Kumar'),
      (auth.uid(), 'Abhinav', 'Sharma'),
      (auth.uid(), 'Yogendra', 'Reddy'),
      (auth.uid(), 'Jansi', ''),
      (auth.uid(), 'Rahul', 'Kumar');
  end if;
end;
$$;

-- The complete personalization algorithm:
-- replace only the literal {{firstName}} token.
create or replace function public.generate_messages(
  p_contact_ids uuid[],
  p_template text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_batch uuid := gen_random_uuid();
  v_requested integer;
  v_found integer;
  v_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_template is null
     or char_length(p_template) not between 1 and 10000 then
    raise exception 'Template must contain 1–10,000 characters';
  end if;

  if strpos(p_template, '{{firstName}}') = 0 then
    raise exception 'Include {{firstName}} in your template';
  end if;

  select count(distinct x) into v_requested
  from unnest(p_contact_ids) as x;

  if v_requested not between 1 and 1000 then
    raise exception 'Select between 1 and 1,000 contacts';
  end if;

  select count(*) into v_found
  from public.contacts
  where user_id = auth.uid()
    and id = any(p_contact_ids);

  if v_found <> v_requested then
    raise exception 'One or more contacts are unavailable';
  end if;

  insert into public.messages (
    user_id,
    contact_id,
    batch_id,
    first_name,
    last_name,
    company,
    linkedin_url,
    template_snapshot,
    body
  )
  select
    auth.uid(),
    c.id,
    v_batch,
    c.first_name,
    c.last_name,
    c.company,
    c.linkedin_url,
    p_template,
    replace(p_template, '{{firstName}}', c.first_name)
  from public.contacts c
  where c.user_id = auth.uid()
    and c.id = any(p_contact_ids);

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.record_message_copy(p_message_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.messages
  set copied_count = copied_count + 1
  where id = p_message_id and user_id = auth.uid();

  if not found then
    raise exception 'Message not found';
  end if;
end;
$$;

create or replace function public.mark_message_sent(p_message_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_sent_at timestamptz;
begin
  update public.messages
  set sent_at = coalesce(sent_at, now())
  where id = p_message_id and user_id = auth.uid()
  returning contact_id, sent_at into v_contact_id, v_sent_at;

  if not found then
    raise exception 'Message not found';
  end if;

  update public.contacts
  set sent_at = coalesce(sent_at, v_sent_at)
  where id = v_contact_id and user_id = auth.uid();
end;
$$;

revoke all on function public.initialize_workspace() from public;
revoke all on function public.generate_messages(uuid[], text) from public;
revoke all on function public.record_message_copy(uuid) from public;
revoke all on function public.mark_message_sent(uuid) from public;

grant execute on function public.initialize_workspace() to authenticated;
grant execute on function public.generate_messages(uuid[], text) to authenticated;
grant execute on function public.record_message_copy(uuid) to authenticated;
grant execute on function public.mark_message_sent(uuid) to authenticated;

