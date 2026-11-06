/**
 * Admin emails to users (Dashboard > Send emails).
 *
 * `pmc_users.emails_enabled` says whether a user receives these emails. Admins
 * switch it in Manage Users (for example when a user replies "unsubscribe").
 * Sending goes through the `admin-send-emails` server function, which reads
 * addresses from the database and checks that the caller is an admin.
 */
import { supabase, getSessionToken } from './supabaseClient';

/** Must match the footer the server function adds (shown as a preview on the page). */
export const EMAIL_FOOTER = [
  '—',
  'CopyZap · copyzap.app',
  "You're receiving this because you have a CopyZap account.",
  'Questions? Just reply to this email.',
  'Don\'t want these updates? Reply "unsubscribe" and we\'ll stop.',
].join('\n');

/** Admin only: the email setting of every user, by user id. */
export async function listEmailFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('pmc_users').select('id, emails_enabled');
  if (error) throw new Error(error.message || 'The email settings could not be loaded.');
  const flags: Record<string, boolean> = {};
  for (const row of (data as { id: string; emails_enabled: boolean | null }[] | null) ?? []) {
    flags[row.id] = row.emails_enabled !== false;
  }
  return flags;
}

/** Admin only: switch a user's emails on or off. */
export async function setEmailsEnabled(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_emails_enabled', { p_user_id: userId, p_enabled: enabled });
  if (error) throw new Error(error.message || 'The setting could not be changed.');
}

export interface SendEmailsResult {
  sent: number;
  failed: { email: string; error: string }[];
  skipped: { id: string; email: string | null; reason: string }[];
}

/** Admin only: send one email to each chosen user. */
export async function sendEmailsToUsers(userIds: string[], subject: string, body: string): Promise<SendEmailsResult> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-send-emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getSessionToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_ids: userIds, subject, body }),
  });
  let result: any = null;
  try {
    result = await response.json();
  } catch {
    // no JSON body
  }
  if (!response.ok) throw new Error(result?.error || `Sending failed (${response.status})`);
  return {
    sent: Number(result?.sent) || 0,
    failed: Array.isArray(result?.failed) ? result.failed : [],
    skipped: Array.isArray(result?.skipped) ? result.skipped : [],
  };
}
