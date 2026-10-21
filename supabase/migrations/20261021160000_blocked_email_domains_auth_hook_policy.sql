drop policy if exists "Auth hook can read blocked domains" on public.blocked_email_domains;
create policy "Auth hook can read blocked domains"
  on public.blocked_email_domains
  for select
  to supabase_auth_admin
  using (true);
