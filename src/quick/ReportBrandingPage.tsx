import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Report branding — accounts with bought credits left (and admins) put their own
 * logo, company name and footer line on Quick's report, replacing CopyZap's.
 * Whether it is on is decided by `report_branding_active()` (true/false), the
 * same check the report export uses. Accounts without it see the page with a
 * notice and the fields locked; saved branding is kept and comes back with the
 * next purchase.
 *
 * Logos: PNG or JPG only, up to 2 MB, at least 200 px wide. Resized in the
 * browser to at most 600 px wide (PNG stays PNG for transparency), stored in the
 * private `report-logos` bucket under the user's id.
 */

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIN_WIDTH = 200;
const LOGO_MAX_WIDTH = 600;

type LogoType = 'image/png' | 'image/jpeg';

interface PendingLogo {
  blob: Blob;
  type: LogoType;
  previewUrl: string;
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be read.')); };
    img.src = url;
  });
}

/** Scales the logo down to at most 600 px wide (never up), keeping its type. */
function resizeLogo(img: HTMLImageElement, type: LogoType): Promise<Blob> {
  const scale = Math.min(1, LOGO_MAX_WIDTH / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('This image could not be processed.'));
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('This image could not be processed.'))),
      type,
      type === 'image/jpeg' ? 0.9 : undefined
    );
  });
}

const inputClass =
  'mt-2 w-full rounded-[4px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 !text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed';

const ReportBrandingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [footerLine, setFooterLine] = useState('');
  const [storedLogoPath, setStoredLogoPath] = useState<string | null>(null);
  const [storedLogoUrl, setStoredLogoUrl] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<PendingLogo | null>(null);
  const [removeStoredLogo, setRemoveStoredLogo] = useState(false);

  const [savedName, setSavedName] = useState('');
  const [savedFooter, setSavedFooter] = useState('');

  const [busy, setBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: isActive }, { data: { user } }] = await Promise.all([
          supabase.rpc('report_branding_active'),
          supabase.auth.getUser(),
        ]);
        if (cancelled) return;
        setActive(isActive === true);
        if (!user) return;
        setUserId(user.id);
        const { data: row } = await supabase
          .from('report_branding')
          .select('company_name, footer_line, logo_path')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled || !row) return;
        setCompanyName(row.company_name || '');
        setFooterLine(row.footer_line || '');
        setSavedName(row.company_name || '');
        setSavedFooter(row.footer_line || '');
        setStoredLogoPath(row.logo_path || null);
        if (row.logo_path) {
          const { data: file } = await supabase.storage.from('report-logos').download(row.logo_path);
          if (!cancelled && file) setStoredLogoUrl(URL.createObjectURL(file));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Free object URLs made for previews.
  useEffect(() => () => { if (storedLogoUrl) URL.revokeObjectURL(storedLogoUrl); }, [storedLogoUrl]);
  useEffect(() => () => { if (pendingLogo) URL.revokeObjectURL(pendingLogo.previewUrl); }, [pendingLogo]);

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoError(null);
    setSaved(false);
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      setLogoError('Please use a PNG or JPG file.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError('This file is larger than 2 MB.');
      return;
    }
    setBusy(true);
    try {
      const img = await readImage(file);
      if (img.naturalWidth < LOGO_MIN_WIDTH) {
        setLogoError('This logo is too small. Please use one at least 200 px wide.');
        return;
      }
      const type = file.type as LogoType;
      const blob = await resizeLogo(img, type);
      setPendingLogo({ blob, type, previewUrl: URL.createObjectURL(blob) });
      setRemoveStoredLogo(false);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'This image could not be read.');
    } finally {
      setBusy(false);
    }
  };

  const onRemoveLogo = () => {
    setSaved(false);
    setLogoError(null);
    if (pendingLogo) {
      setPendingLogo(null);
      return;
    }
    setRemoveStoredLogo(true);
  };

  const shownLogo = pendingLogo?.previewUrl ?? (removeStoredLogo ? null : storedLogoUrl);
  const changed =
    companyName.trim() !== savedName.trim() ||
    footerLine.trim() !== savedFooter.trim() ||
    pendingLogo !== null ||
    removeStoredLogo;
  const locked = !active || busy || loading;

  const save = async () => {
    if (!userId || !active) return;
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      let logoPath = storedLogoPath;

      if (pendingLogo) {
        const ext = pendingLogo.type === 'image/png' ? 'png' : 'jpg';
        const newPath = `${userId}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('report-logos')
          .upload(newPath, pendingLogo.blob, { contentType: pendingLogo.type, upsert: true });
        if (upErr) throw new Error('The logo could not be uploaded. Please try again.');
        if (storedLogoPath && storedLogoPath !== newPath) {
          await supabase.storage.from('report-logos').remove([storedLogoPath]);
        }
        logoPath = newPath;
      } else if (removeStoredLogo && storedLogoPath) {
        await supabase.storage.from('report-logos').remove([storedLogoPath]);
        logoPath = null;
      }

      const name = companyName.trim();
      const footer = footerLine.trim();
      const { error: dbErr } = await supabase.from('report_branding').upsert(
        {
          user_id: userId,
          company_name: name || null,
          footer_line: footer || null,
          logo_path: logoPath,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (dbErr) throw new Error('Your branding could not be saved. Please try again.');

      // The saved state is now what is on screen.
      if (pendingLogo) {
        setStoredLogoUrl(URL.createObjectURL(pendingLogo.blob));
        setPendingLogo(null);
      } else if (removeStoredLogo) {
        setStoredLogoUrl(null);
      }
      setStoredLogoPath(logoPath);
      setRemoveStoredLogo(false);
      setSavedName(name);
      setSavedFooter(footer);
      setCompanyName(name);
      setFooterLine(footer);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your branding could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const previewName = companyName.trim();
  const previewFooter = footerLine.trim();
  const today = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[56px] flex items-center justify-between">
          <Link to="/" aria-label="CopyZap home" className="inline-flex items-center min-h-[44px] hover:opacity-80">
            <img src="/copyzap.png" alt="CopyZap" className="h-5 sm:h-6 w-auto" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center min-h-[44px] px-3 font-medium text-gray-900 dark:text-gray-100 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Back to CopyZap
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="inline-flex items-center gap-2.5 text-[13px] font-semibold tracking-[.12em] uppercase text-primary-500">
            <span className="w-[22px] h-0.5 bg-primary-500" aria-hidden="true" />
            Report branding
          </p>
          <h1 className="mt-3.5 !mb-0 !text-[30px] sm:!text-[42px] !leading-tight font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Your brand on every report
          </h1>
          <p className="mt-3.5 !text-lg text-gray-700 dark:text-gray-300">
            Put your own logo and company name on the reports you send to your clients.
            CopyZap's name is removed from the report.
          </p>
        </div>

        {loading && <p className="mt-10 text-center text-gray-600 dark:text-gray-400">Loading…</p>}

        {!loading && !active && (
          <div className="mt-8 rounded-[6px] border !text-base border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-4 text-center text-gray-800 dark:text-gray-200">
            Report branding comes with any credit pack. Your saved branding is kept and shows again as
            soon as you have bought credits.{' '}
            <Link to="/buy" className="font-semibold text-primary-700 dark:text-primary-300 underline">
              Buy credits
            </Link>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-8 rounded-[6px] border !text-base border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 text-center text-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        {saved && (
          <div role="status" className="mt-8 rounded-[6px] border !text-base border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-center text-green-900 dark:text-green-200">
            Saved. Your next report will use this branding.
          </div>
        )}

        {!loading && (
          <div className="mt-10 rounded-[6px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-6 sm:px-8 py-8">
            <label className="block !text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="rb-company">
              Company name
            </label>
            <input
              id="rb-company"
              type="text"
              value={companyName}
              onChange={e => { setCompanyName(e.target.value); setSaved(false); }}
              maxLength={80}
              disabled={locked}
              placeholder="Your agency"
              className={inputClass}
            />

            <label className="block mt-6 !text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="rb-footer">
              Footer line <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="rb-footer"
              type="text"
              value={footerLine}
              onChange={e => { setFooterLine(e.target.value); setSaved(false); }}
              maxLength={120}
              disabled={locked}
              placeholder="e.g. www.youragency.com · hello@youragency.com"
              className={inputClass}
            />

            <div className="mt-6">
              <span className="block !text-base font-medium text-gray-900 dark:text-gray-100">Logo</span>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {shownLogo && (
                  <img
                    src={shownLogo}
                    alt="Your logo"
                    className="h-14 w-auto max-w-[220px] object-contain rounded-[4px] border border-gray-200 dark:border-gray-700 bg-white p-1"
                  />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={locked}
                  className="inline-flex items-center min-h-[44px] px-4 rounded-[4px] border border-gray-300 dark:border-gray-700 !text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {shownLogo ? 'Upload another logo' : 'Upload logo'}
                </button>
                {shownLogo && (
                  <button
                    type="button"
                    onClick={onRemoveLogo}
                    disabled={locked}
                    className="!text-[15px] font-medium text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Remove logo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={onPickLogo}
                  className="hidden"
                />
              </div>
              <p className="mt-2 !text-[15px] text-gray-500 dark:text-gray-400">
                PNG or JPG, up to 2&nbsp;MB, at least 200&nbsp;px wide. A PNG with a transparent background looks best.
              </p>
              {logoError && (
                <p role="alert" className="mt-2 !text-[15px] text-red-700 dark:text-red-400">{logoError}</p>
              )}
            </div>

            <div className="mt-8">
              <span className="block !text-base font-medium text-gray-900 dark:text-gray-100">Preview</span>
              <div className="mt-3 rounded-[4px] overflow-hidden border border-gray-200 dark:border-gray-700">
                <div style={{ background: '#f3f4f6', padding: '32px 40px' }}>
                  <div className="flex items-center justify-between gap-4" style={{ paddingBottom: 20, borderBottom: '1px solid #d1d5db' }}>
                    <div className="min-h-[28px] flex items-center">
                      {shownLogo ? (
                        <img src={shownLogo} alt="" style={{ height: 28, width: 'auto', maxWidth: 220, objectFit: 'contain' }} />
                      ) : previewName ? (
                        <span style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>{previewName}</span>
                      ) : null}
                    </div>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
                      {previewName ? `${previewName} — Copy Report` : 'Copy Report'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center !text-[13px] text-gray-500 dark:text-gray-400">
                Footer: {previewFooter ? `${previewFooter} — ${today}` : today}
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={locked || !changed}
                className="inline-flex justify-center items-center min-h-[48px] px-6 rounded-[4px] bg-primary-500 text-white !text-base !font-semibold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center !text-[15px] text-gray-500 dark:text-gray-400">
          Branding appears only on the reports you export. It does not change the CopyZap app itself.
        </p>
      </main>
    </div>
  );
};

export default ReportBrandingPage;
