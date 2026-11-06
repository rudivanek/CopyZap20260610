import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw, Search, Send, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './ui/LoadingSpinner';
import { adminGetUsers } from '../services/supabaseClient';
import { EMAIL_FOOTER, listEmailFlags, sendEmailsToUsers } from '../services/userEmails';

interface Recipient {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Admin page: write one plain-text email and send it to one, several or all
 * users. Users whose emails are off (Manage Users) or whose address is not
 * confirmed are not listed. Each user gets their own email.
 */
const SendEmails: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin(currentUser);

  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('Hi {name},\n\n');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminGetUsers();
      if (error) throw error;
      const flags = await listEmailFlags();
      const all = (data || []) as { id: string; email: string; name: string | null; email_confirmed_at?: string | null }[];
      const allowed = all.filter(u => u.email && u.email_confirmed_at && flags[u.id] !== false);
      allowed.sort((a, b) => a.email.localeCompare(b.email));
      setRecipients(allowed.map(u => ({ id: u.id, email: u.email, name: u.name })));
      setHiddenCount(all.length - allowed.length);
      setSelected(prev => new Set([...prev].filter(id => allowed.some(u => u.id === id))));
    } catch (err: any) {
      toast.error(`Could not load the users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    else if (!isAdminLoading) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAdminLoading]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(r => r.email.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q));
  }, [recipients, search]);

  const allVisibleSelected = visible.length > 0 && visible.every(r => selected.has(r.id));

  const toggle = (id: string) => {
    setConfirming(false);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setConfirming(false);
    setSelected(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach(r => next.delete(r.id));
      else visible.forEach(r => next.add(r.id));
      return next;
    });
  };

  const canSend = selected.size > 0 && subject.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setSending(true);
    try {
      const result = await sendEmailsToUsers([...selected], subject.trim(), body);
      const problems = result.failed.length + result.skipped.length;
      if (result.sent > 0) {
        toast.success(`Sent to ${result.sent} user${result.sent === 1 ? '' : 's'}${problems ? `; ${problems} not sent` : ''}`);
      }
      if (problems > 0) {
        const lines = [
          ...result.failed.map(f => `${f.email}: ${f.error}`),
          ...result.skipped.map(s => `${s.email || s.id}: ${s.reason}`),
        ];
        toast.error(`Not sent:\n${lines.slice(0, 8).join('\n')}${lines.length > 8 ? '\n…' : ''}`, { duration: 10000 });
      }
      if (result.sent > 0 && problems === 0) {
        setSelected(new Set());
        setSubject('');
        setBody('Hi {name},\n\n');
      }
    } catch (err: any) {
      toast.error(err.message || 'Sending failed');
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <Shield size={48} className="text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have permission to access this page.</p>
          <button onClick={() => navigate('/dashboard')} className="bg-primary-600 text-white px-4 py-2 rounded-md">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const firstSelected = recipients.find(r => selected.has(r.id));
  const previewName = (firstSelected?.name || '').trim() || 'there';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Mail size={32} className="text-primary-500 mr-3" />
                Send emails to users
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                From hi@copyzap.app. Replies go to hi@copyzap.app. Each user gets their own email.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center"
            disabled={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-6">
          {/* Recipients */}
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg flex flex-col max-h-[calc(100vh-12rem)]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Recipients</h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selected.size} of {recipients.length} selected
                </span>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allVisibleSelected}
                  disabled={visible.length === 0}
                  onChange={toggleAllVisible}
                />
                {search.trim() ? `Select all shown (${visible.length})` : `Select all (${recipients.length})`}
              </label>
              {hiddenCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hiddenCount} user{hiddenCount === 1 ? ' is' : 's are'} not listed: emails off in Manage Users, or address not confirmed.
                </p>
              )}
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1">
              {visible.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No users.</p>
              ) : (
                visible.map(r => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input type="checkbox" className="h-4 w-4" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    <span className="min-w-0">
                      <span className="block text-sm truncate">{r.email}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{r.name || 'No name'}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-5 space-y-4">
            <div>
              <label htmlFor="email-subject" className="block text-sm font-medium mb-1">Subject</label>
              <input
                id="email-subject"
                type="text"
                maxLength={200}
                value={subject}
                onChange={e => { setSubject(e.target.value); setConfirming(false); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label htmlFor="email-body" className="block text-sm font-medium mb-1">Body</label>
              <textarea
                id="email-body"
                rows={14}
                maxLength={20000}
                value={body}
                onChange={e => { setBody(e.target.value); setConfirming(false); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Plain text. Write <code>{'{name}'}</code> where the user's name goes; users without a name get "there".
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Added to every email</p>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-sans">{EMAIL_FOOTER}</pre>
            </div>
            {firstSelected && body.trim() && (
              <div>
                <p className="text-sm font-medium mb-1">Preview for {firstSelected.email}</p>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-sans max-h-64 overflow-y-auto">
                  {`Subject: ${subject.replace(/\{name\}/gi, previewName)}\n\n${body.replace(/\{name\}/gi, previewName).trimEnd()}\n\n${EMAIL_FOOTER}`}
                </pre>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              {confirming && (
                <>
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    Send this email to {selected.size} user{selected.size === 1 ? '' : 's'}?
                  </span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700"
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm flex items-center"
              >
                {sending ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
                {sending ? 'Sending...' : confirming ? 'Yes, send' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendEmails;
