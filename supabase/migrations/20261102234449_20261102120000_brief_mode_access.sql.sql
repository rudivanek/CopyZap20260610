insert into public.app_settings (key, value, updated_at, updated_by)
values ('brief_mode_access', 'admin', now(), 'migration')
on conflict (key) do nothing;

create or replace function public.brief_mode_allowed()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select case coalesce((select value from public.app_settings where key = 'brief_mode_access'), 'off')
    when 'all'   then auth.uid() is not null
    when 'paid'  then public.report_branding_active()
    when 'admin' then public.is_app_admin()
    else false
  end;
$$;

grant execute on function public.brief_mode_allowed() to authenticated;