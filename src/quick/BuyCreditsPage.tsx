import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Buy credits (Stripe Checkout). Only shown to accounts allowed by can_use_paywall():
 * admins, accounts with paywall_access, or everyone once app_settings.paywall_public is 'true'.
 * Credits are added by the stripe-webhook function after payment, never by this page.
 */

interface Pack {
  pack_key: string;
  pack_name: string;
  credits: number;
  usd_cents: number;
  mxn_cents: number;
  sort_order: number;
  validity_months: number;
}

interface Balance {
  mode?: string;
  credits_remaining?: number;
  purchase_expiry?: string | null;
  next_expiry?: string | null;
}

/** Credits a typical ~1,000-word web page run uses (measured October 2026). */
const CREDITS_PER_PAGE = 62;

const formatAmount = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

const BuyCreditsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [busyPack, setBusyPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.rpc('get_user_credits_balance', { user_id_param: user.id });
    if (data) setBalance(data as Balance);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: canUse, error: canUseError } = await supabase.rpc('can_use_paywall');
      if (cancelled) return;
      if (canUseError || canUse !== true) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      const { data: packRows, error: packError } = await supabase
        .from('credit_packs')
        .select('pack_key, pack_name, credits, usd_cents, mxn_cents, sort_order, validity_months')
        .eq('is_active', true)
        .order('sort_order');
      if (cancelled) return;
      if (packError) setError('The credit packs could not be loaded. Please reload the page.');
      else setPacks((packRows || []) as Pack[]);
      await loadBalance();
    })();
    return () => { cancelled = true; };
  }, []);

  // After a card payment Stripe sends the buyer back before the webhook may have run:
  // read the balance again a few times so the new credits appear without a reload.
  useEffect(() => {
    if (status !== 'success' || !allowed) return;
    const timers = [3000, 8000, 15000].map(ms => setTimeout(loadBalance, ms));
    return () => timers.forEach(clearTimeout);
  }, [status, allowed]);

  const buy = async (packKey: string) => {
    setError(null);
    setBusyPack(packKey);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { pack_key: packKey },
      });
      if (fnError || !data?.url) {
        let message = 'The payment page could not be opened. Please try again.';
        try {
          const body = await (fnError as any)?.context?.json?.();
          if (body?.error) message = body.error;
        } catch { /* keep the default message */ }
        setError(message);
        setBusyPack(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('The payment page could not be opened. Please try again.');
      setBusyPack(null);
    }
  };

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {allowed === null && (
          <p className="text-gray-600 dark:text-gray-400">Loading…</p>
        )}

        {allowed === false && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Buying credits is coming soon</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Credit packs are not on sale yet. If you need more credits now, write to{' '}
              <a href="mailto:hi@copyzap.app" className="underline">hi@copyzap.app</a>.
            </p>
          </div>
        )}

        {allowed === true && (
          <>
            <div className="max-w-2xl mx-auto text-center">
              <p className="inline-flex items-center gap-2.5 text-[13px] font-semibold tracking-[.12em] uppercase text-primary-500">
                <span className="w-[22px] h-0.5 bg-primary-500" aria-hidden="true" />
                Buy credits
              </p>
              <h1 className="mt-3.5 !mb-0 !text-[30px] sm:!text-[42px] !leading-tight font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Pay once. No subscription.
              </h1>
              <p className="mt-3.5 !text-lg text-gray-700 dark:text-gray-300">
                Buy a pack of credits and use them when you have work. Bigger packs stay valid longer.
              </p>
            </div>

            {balance?.mode === 'prepaid' && (
              <p className="mt-8 text-center !text-base text-gray-900 dark:text-gray-100">
                You have{' '}
                <span className="font-semibold tabular-nums">
                  {(balance.credits_remaining ?? 0).toLocaleString('en-US')} credits
                </span>
                {balance.purchase_expiry && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {' '}· bought credits valid until {formatDate(balance.purchase_expiry)}
                  </span>
                )}
              </p>
            )}

            {status === 'success' && (
              <div role="status" className="mt-8 max-w-3xl mx-auto rounded-[6px] border !text-base border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-center text-green-900 dark:text-green-200">
                Thank you, your payment went through. Your credits appear here within a minute.
              </div>
            )}
            {status === 'cancelled' && (
              <div role="status" className="mt-8 max-w-3xl mx-auto rounded-[6px] border !text-base border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 p-4 text-center text-gray-700 dark:text-gray-300">
                The payment was cancelled. Nothing was charged.
              </div>
            )}
            {error && (
              <div role="alert" className="mt-8 max-w-3xl mx-auto rounded-[6px] border !text-base border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 text-center text-red-900 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="mt-12 grid gap-7 md:grid-cols-3">
              {packs.map((pack, i) => {
                const highlighted = packs.length === 3 && i === 1;
                return (
                  <div
                    key={pack.pack_key}
                    className={
                      'flex flex-col rounded-[6px] bg-white dark:bg-gray-900 px-7 py-8 border ' +
                      (highlighted
                        ? 'border-gray-900 dark:border-gray-300 shadow-[0_20px_40px_-24px_rgba(17,24,39,.25)]'
                        : 'border-gray-200 dark:border-gray-700')
                    }
                  >
                    <h2 className="!mb-0 !text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{pack.pack_name}</h2>
                    <p className="mt-4 mb-1 !leading-none text-gray-900 dark:text-gray-100">
                      <span className="text-[44px] font-semibold tracking-tight">${formatAmount(pack.usd_cents)}</span>
                      <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">USD</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      In Mexico: MX${formatAmount(pack.mxn_cents)}, IVA included
                    </p>
                    <ul className="mt-6 mb-7 text-base text-gray-700 dark:text-gray-300">
                      <li className="py-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {pack.credits.toLocaleString('en-US')} credits
                      </li>
                      <li className="py-2 border-t border-gray-200 dark:border-gray-700">
                        About {Math.floor(pack.credits / CREDITS_PER_PAGE)} web pages of ~1,000 words
                      </li>
                      <li className="py-2 border-t border-gray-200 dark:border-gray-700">
                        Valid for {pack.validity_months} months
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => buy(pack.pack_key)}
                      disabled={busyPack !== null}
                      className="mt-auto w-full inline-flex justify-center items-center min-h-[48px] px-5 rounded-[4px] bg-primary-500 text-white !text-base !font-semibold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      {busyPack === pack.pack_key ? 'Opening payment…' : `Buy ${pack.pack_name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-9 max-w-3xl mx-auto text-center text-gray-700 dark:text-gray-300">
              <p className="!text-base">
                Payment is handled by Stripe. A long page or a second run uses more credits; a short text uses fewer.
                Have a promotion code? Enter it on the payment page.
              </p>
              <p className="mt-2 !text-[15px] text-gray-500 dark:text-gray-400">
                A new pack never shortens credits you already have, and bought credits that expired less than 15 days
                ago come back with your next pack.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BuyCreditsPage;
