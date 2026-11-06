import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireAdmin } from '../_shared/admin.ts';

/**
 * Admin only: sends one plain-text email to each chosen user.
 *
 * The caller sends `user_ids`, `subject` and `body`. Addresses and names are
 * read from the database here, never taken from the request, so this function
 * can only write to existing CopyZap users. Users whose emails are switched
 * off (`pmc_users.emails_enabled = false`) or whose address is not confirmed
 * are skipped. Every user gets their own email; nobody sees other addresses.
 *
 * `{name}` in the subject or body becomes the user's name ("there" when the
 * account has none). The footer is always added here.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

const FROM = 'CopyZap <hi@copyzap.app>';
const REPLY_TO = ['hi@copyzap.app'];
const FOOTER = [
  '—',
  'CopyZap · copyzap.app',
  "You're receiving this because you have a CopyZap account.",
  'Questions? Just reply to this email.',
  'Don\'t want these updates? Reply "unsubscribe" and we\'ll stop.',
].join('\n');

const MAX_RECIPIENTS = 1000;
const MAX_SUBJECT = 200;
const MAX_BODY = 20000;
const BATCH_SIZE = 100; // Resend batch limit

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces {name} (any case) with the user's name. */
export function personalise(text: string, name: string | null | undefined): string {
  const display = String(name ?? '').trim().slice(0, 80) || 'there';
  return text.replace(/\{name\}/gi, display);
}

/** The full plain-text body: the admin's text, a blank line, the footer. */
export function buildBody(body: string, name: string | null | undefined): string {
  return `${personalise(body, name).trimEnd()}\n\n${FOOTER}\n`;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return json({ error: 'The function is missing a setting (database access or RESEND_API_KEY).' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Only a signed-in admin.
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);
    const forbidden = await requireAdmin(supabaseAdmin, user);
    if (forbidden) return json({ error: 'Forbidden - Admin access required' }, 403);

    // 2. Check the request.
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Invalid request' }, 400);
    }
    const subject = typeof payload?.subject === 'string' ? payload.subject.trim() : '';
    const body = typeof payload?.body === 'string' ? payload.body.replace(/\r\n/g, '\n') : '';
    const rawIds = Array.isArray(payload?.user_ids) ? payload.user_ids : [];
    const userIds = [...new Set(rawIds.filter((id: unknown) => typeof id === 'string' && uuidRegex.test(id)))] as string[];

    if (!subject) return json({ error: 'Subject is required' }, 400);
    if (subject.length > MAX_SUBJECT) return json({ error: `Subject is longer than ${MAX_SUBJECT} characters` }, 400);
    if (/[\r\n]/.test(subject)) return json({ error: 'Subject must be one line' }, 400);
    if (!body.trim()) return json({ error: 'Body is required' }, 400);
    if (body.length > MAX_BODY) return json({ error: `Body is longer than ${MAX_BODY.toLocaleString('en-US')} characters` }, 400);
    if (userIds.length === 0) return json({ error: 'Choose at least one user' }, 400);
    if (userIds.length > MAX_RECIPIENTS) return json({ error: `At most ${MAX_RECIPIENTS} users per send` }, 400);

    // 3. Read the chosen users from the database.
    const { data: rows, error: rowsError } = await supabaseAdmin
      .from('pmc_users')
      .select('id, name, email, emails_enabled')
      .in('id', userIds);
    if (rowsError) return json({ error: `Could not read the users: ${rowsError.message}` }, 500);

    const skipped: { id: string; email: string | null; reason: string }[] = [];
    const recipients: { id: string; email: string; name: string | null }[] = [];
    const found = new Map((rows || []).map(r => [r.id, r]));

    for (const id of userIds) {
      const row = found.get(id);
      if (!row) {
        skipped.push({ id, email: null, reason: 'not found' });
        continue;
      }
      if (row.emails_enabled === false) {
        skipped.push({ id, email: row.email, reason: 'emails off' });
        continue;
      }
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(id);
      const authUser = authData?.user;
      const email = authUser?.email || row.email;
      if (!authUser || !email) {
        skipped.push({ id, email: row.email, reason: 'no address' });
        continue;
      }
      if (!authUser.email_confirmed_at) {
        skipped.push({ id, email, reason: 'address not confirmed' });
        continue;
      }
      recipients.push({ id, email, name: row.name });
    }

    if (recipients.length === 0) {
      return json({ error: 'None of the chosen users can receive emails', skipped }, 400);
    }

    // 4. Send, one email per user, in batches of up to 100.
    let sentCount = 0;
    const failures: { email: string; error: string }[] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const emails = chunk.map(r => ({
        from: FROM,
        to: [r.email],
        reply_to: REPLY_TO,
        subject: personalise(subject, r.name),
        text: buildBody(body, r.name),
      }));
      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify(emails),
        });
        if (res.ok) {
          sentCount += chunk.length;
        } else {
          const detail = (await res.text()).slice(0, 300);
          console.error('[admin-send-emails] Resend refused a batch:', res.status, detail);
          for (const r of chunk) failures.push({ email: r.email, error: `Resend ${res.status}` });
        }
      } catch (err) {
        console.error('[admin-send-emails] Resend call failed:', err);
        for (const r of chunk) failures.push({ email: r.email, error: 'network error' });
      }
      if (i + BATCH_SIZE < recipients.length) await sleep(600); // stay under Resend's rate limit
    }

    // 5. Keep a record of the send.
    const { error: logError } = await supabaseAdmin.from('admin_email_sends').insert({
      sent_by: user.email ?? user.id,
      subject,
      body,
      recipient_count: recipients.length,
      sent_count: sentCount,
      recipients: recipients.map(r => r.email),
      failures: [...failures, ...skipped.map(s => ({ email: s.email, error: s.reason }))],
    });
    if (logError) console.error('[admin-send-emails] Could not record the send:', logError);

    return json({ sent: sentCount, failed: failures, skipped });
  } catch (error) {
    console.error('[admin-send-emails] Unexpected error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
