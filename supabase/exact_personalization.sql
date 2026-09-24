alter table public.messages
add constraint messages_exact_personalization
check (
  body = replace(template_snapshot, '{{firstName}}', first_name)
);

alter table public.messages
add constraint messages_first_name_required
check (
  char_length(btrim(first_name)) > 0
);

alter table public.messages
add constraint messages_template_variable_required
check (
  strpos(template_snapshot, '{{firstName}}') > 0
);
