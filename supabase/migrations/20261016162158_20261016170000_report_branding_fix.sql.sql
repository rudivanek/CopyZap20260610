/*
# Report branding — fix-up

1. Branding is on only for admins (is_app_admin) and accounts with BOUGHT
   credits left that have not expired. Trial credits do not count.
   report_branding_active() now just answers true/false; the app reads the
   branding row and the logo itself, so no expiring links end up in reports.
2. A logo without a company name is allowed; name and footer have length limits.
3. The report-logos bucket only takes PNG and JPG, 2 MB max.
*/

drop function if exists public.report_branding_active();

create function public.report_branding_active()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select public.is_app_admin()
      or exists (
        select 1 from public.credit_grants
        where user_id = auth.uid()
          and source = 'purchase'
          and remaining > 0
          and expires_at > now()
      );
$$;
revoke all on function public.report_branding_active() from public, anon;
grant execute on function public.report_branding_active() to authenticated;

alter table public.report_branding alter column company_name drop not null;

alter table public.report_branding drop constraint if exists report_branding_company_name_len;
alter table public.report_branding add constraint report_branding_company_name_len
  check (company_name is null or char_length(company_name) <= 80);

alter table public.report_branding drop constraint if exists report_branding_footer_line_len;
alter table public.report_branding add constraint report_branding_footer_line_len
  check (footer_line is null or char_length(footer_line) <= 120);

update storage.buckets
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png', 'image/jpeg']
where id = 'report-logos';
