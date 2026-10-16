import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Report branding — paying accounts (active bought credits or admins) can put
 * their own logo, company name, and footer line on Quick's report export,
 * replacing all CopyZap branding. Access is decided by `report_branding_active`
 * (the same RPC the export reads): if it returns nothing, the page explains that
 * branding is a paid feature and shows how to buy credits.
 *
 * The logo is uploaded to the private `report-logos` bucket under the user's id,
 * downscaled to a max width of 320px on a canvas before upload so the stored
 * file is small. The brand row (company name, footer line, logo path) lives in
 * the `report_branding` table; RLS lets each user touch only their own row.
 */
interface BrandRow {
  company_name: string;
  footer_line: string | null;
  logo_path: string | null;
}

const LOGO_MAX_WIDTH = 320;

const ReportBrandingPage: React.FC = () => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [footerLine, setFooterLine] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // A pending File chosen by the user, kept until Save is pressed.
  const pendingFileRef = useRef<File | null>(null);
  // The path currently stored in the database, so we can delete the old object
  // when a new logo is uploaded.
  const storedLogoPathRef = useRef<string | null>(null);

  const loadBrand = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('report_branding')
      .select('company_name, footer_line, logo_path')
      .eq('user_id', user.id)
      .maybeSingle();
    const row = data as BrandRow | null;
    if (row) {
      setCompanyName(row.company_name || '');
      setFooterLine(row.footer_line || '');
      storedLogoPathRef.current = row.logo_path || null;
      if (row.logo_path) {
        const { data: urlData } = await supabase.storage
          .from('report-logos')
          .createSignedUrl(row.logo_path, 3600);
        setSavedLogoUrl(urlData?.signedUrl ?? null);
      } else {
        setSavedLogoUrl(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('report_branding_active');
      if (cancelled) return;
      const row = (Array.isArray(data) ? data[0] : data) as
        | { company_name: string; footer_line: string | null; logo_url: string | null }
        | null;
      // If the RPC returns a brand, the account is allowed. If it returns null
      // but the account is an admin with no brand row yet, still allow it.
      if (row) {
        setAllowed(true);
        await loadBrand();
      } else {
        // Distinguish "not allowed" from "allowed but no brand yet" by checking
        // admin status separately. Admins may have no brand row yet.
        const { data: adminCheck } = await supabase.rpc('is_admin');
        if (adminCheck === true) {
          setAllowed(true);
          await loadBrand();
        } else {
          setAllowed(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [loadBrand]);

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or SVG).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('The logo must be under 4 MB.');
      return;
    }
    setError(null);
    pendingFileRef.current = file;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    pendingFileRef.current = null;
    setLogoPreview(null);
    setSavedLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Resize the chosen logo to a max width on a canvas and return a Blob.
  const resizeLogo = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, LOGO_MAX_WIDTH / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not process the image.'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
            'image/png'
          );
        };
        img.onerror = () => reject(new Error('Could not read the image.'));
        img.src = typeof reader.result === 'string' ? reader.result : '';
      };
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.readAsDataURL(file);
    });

  const save = async () => {
    setError(null);
    setSaved(false);
    const name = companyName.trim();
    if (!name) {
      setError('A company name is required.');
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in to save branding.');
        setBusy(false);
        return;
      }

      let logoPath = storedLogoPathRef.current;
      const pendingFile = pendingFileRef.current;

      // New logo chosen: upload it (resized), and remove the old object if any.
      if (pendingFile) {
        const resized = await resizeLogo(pendingFile);
        const ext = 'png';
        const newPath = `${user.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('report-logos')
          .upload(newPath, resized, { contentType: 'image/png', upsert: true });
        if (upErr) throw new Error('The logo could not be uploaded. Please try again.');
        logoPath = newPath;
        // Remove the previous object if it was different.
        if (storedLogoPathRef.current && storedLogoPathRef.current !== newPath) {
          await supabase.storage.from('report-logos').remove([storedLogoPathRef.current]);
        }
        storedLogoPathRef.current = newPath;
        pendingFileRef.current = null;
      }

      const { error: dbErr } = await supabase
        .from('report_branding')
        .upsert(
          {
            user_id: user.id,
            company_name: name,
            footer_line: footerLine.trim() || null,
            logo_path: logoPath,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (dbErr) throw new Error('The branding could not be saved. Please try again.');

      // Refresh the saved-logo preview.
      if (logoPath) {
        const { data: urlData } = await supabase.storage
          .from('report-logos')
          .createSignedUrl(logoPath, 3600);
        setSavedLogoUrl(urlData?.signedUrl ?? null);
      } else {
        setSavedLogoUrl(null);
      }
      setLogoPreview(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The branding could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const shownLogo = logoPreview || savedLogoUrl;

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
        {allowed === null && (
          <p className="text-gray-600 dark:text-gray-400">Loading…</p>
        )}

        {allowed === false && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Report branding is a paid feature</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Put your own logo, company name, and footer on every Quick report
              instead of CopyZap's. Buy a pack of credits to unlock it.
            </p>
            <Link
              to="/buy"
              className="mt-6 inline-flex items-center min-h-[48px] px-5 rounded-[4px] bg-primary-500 text-white !text-base !font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Buy credits
            </Link>
          </div>
        )}

        {allowed === true && (
          <>
            <div className="max-w-2xl mx-auto text-center">
              <p className="inline-flex items-center gap-2.5 text-[13px] font-semibold tracking-[.12em] uppercase text-primary-500">
                <span className="w-[22px] h-0.5 bg-primary-500" aria-hidden="true" />
                Report branding
              </p>
              <h1 className="mt-3.5 !mb-0 !text-[30px] sm:!text-[42px] !leading-tight font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Your brand on every report
              </h1>
              <p className="mt-3.5 !text-lg text-gray-700 dark:text-gray-300">
                Replace CopyZap's logo, name, and footer with your own on Quick's
                report export.
              </p>
            </div>

            {error && (
              <div role="alert" className="mt-8 rounded-[6px] border !text-base border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 text-center text-red-900 dark:text-red-200">
                {error}
              </div>
            )}
            {saved && (
              <div role="status" className="mt-8 rounded-[6px] border !text-base border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-center text-green-900 dark:text-green-200">
                Saved. Your next Quick report will carry your brand.
              </div>
            )}

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
                placeholder="Acme Inc."
                className="mt-2 w-full rounded-[4px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 !text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                placeholder="© 2026 Acme Inc. All rights reserved."
                className="mt-2 w-full rounded-[4px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 !text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <div className="mt-6">
                <span className="block !text-base font-medium text-gray-900 dark:text-gray-100">Logo</span>
                <p className="mt-1 !text-[15px] text-gray-500 dark:text-gray-400">
                  PNG, JPG, or SVG. Up to 4&nbsp;MB. Shown at 28px tall on the report.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  {shownLogo ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={shownLogo}
                        alt="Your logo"
                        className="h-14 w-auto max-w-[200px] object-contain rounded-[4px] border border-gray-200 dark:border-gray-700 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="!text-[15px] font-medium text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center min-h-[44px] px-4 rounded-[4px] border border-gray-300 dark:border-gray-700 !text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Choose logo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={onPickLogo}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="inline-flex justify-center items-center min-h-[48px] px-6 rounded-[4px] bg-primary-500 text-white !text-base !font-semibold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {busy ? 'Saving…' : 'Save branding'}
                </button>
              </div>
            </div>

            <p className="mt-6 text-center !text-[15px] text-gray-500 dark:text-gray-400">
              Branding appears only on reports you export. It does not change the
              CopyZap app itself.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default ReportBrandingPage;
